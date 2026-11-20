import { getAgentRunById, updateAgentRun } from '../../data/agent-runs';
import { listConventionChanges } from '../../data/convention-changes';
import { listConventionChangePropagations, updateConventionChangePropagations } from '../../data/convention-change-propagations';
import { listConventionSources } from '../../data/convention-sources';
import { createTemplateChange, listTemplateChanges, updateTemplateChange } from '../../data/template-changes';
import type { AgentRun, AgentRunFinding, ConventionChangePropagationStatus, TemplateChange, TemplateChangeFile } from '../../model/agent-run';
import type { ConventionChange } from '../../model/convention-change';
import { callAgentAi } from '../agent-runs/call-agent-ai';
import { syntaxErrors } from '../agent-runs/check-edited-files';
import { fenceFile, keepTrailingNewline } from '../agent-runs/file-text';
import { MAX_PROMPT_FILE_CHARS, MAX_TEMPLATE_FILES_TO_READ, templateBranchName, titleFrom } from '../agent-runs/config';
import { loadFileChecks } from '../agent-runs/load-file-checks';
import type { CanonicalDataClient } from '../canonical-data-client';
import { loadTemplateSource, type CodegenManifest, type TemplateSource } from '../codegen';
import {
  commitFilesToBranch,
  createPullRequest,
  findOpenPullRequest,
  getBranchHeadSha,
  getDefaultBranchHead,
  getFileText,
  listTreePaths,
  type GithubRepoRef,
} from '../github';
import { loadSampleDataModel, renderTemplateSample } from './render-template-sample';
import {
  describeCarriedChanges,
  TEMPLATE_EDIT_SCHEMA,
  TEMPLATE_SELECT_SCHEMA,
  TEMPLATE_SYSTEM_PROMPT,
  type TemplateEditAnswer,
  type TemplateSelectAnswer,
} from './template-agent-prompts';

const FORBIDDEN_PATH = /(^|\/)(\.github|node_modules|\.git)\/|(^|\/)\.env|package-lock\.json$/;

/** codegen | adr | scaffold */
export const templateFileArea = (path: string): string =>
  path.startsWith('codegen/') ? 'codegen' : path.startsWith('.cursor/architecture/') ? 'adr' : 'scaffold';

export const parseRepoFullName = (fullName: string): GithubRepoRef => {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) throw new Error(`Invalid template repo: ${fullName}`);
  return { owner, repo };
};

/** One template repo a run works on, and the carried changes that still need it. */
export type TemplateRepoTarget = { repo: string; role_key: string; changes: ConventionChange[] };

/**
 * The repos this run works on: every repo with a pending / in-run propagation row, each with the
 * changes it carries (statuses narrows which rows count, e.g. only pending ones on retry).
 */
export const loadRepoTargets = async (
  client: CanonicalDataClient,
  run: AgentRun,
  statuses: ConventionChangePropagationStatus[] = ['pending', 'in_run'],
): Promise<TemplateRepoTarget[]> => {
  const propagations = (await listConventionChangePropagations(client, { run_id: run.id })).filter((row) => statuses.includes(row.status));
  if (propagations.length === 0) return [];
  const changes = await listConventionChanges(client, { ids: [...new Set(propagations.map((row) => row.convention_change_id))], limit: 1000 });
  const byId = new Map(changes.map((change) => [change.id, change]));
  const targets = new Map<string, TemplateRepoTarget>();
  for (const row of propagations) {
    const change = byId.get(row.convention_change_id);
    if (!change) continue;
    const target = targets.get(row.template_repo) ?? { repo: row.template_repo, role_key: row.role_key, changes: [] };
    target.changes.push(change);
    targets.set(row.template_repo, target);
  }
  return [...targets.values()].sort((a, b) => a.repo.localeCompare(b.repo));
};

/** Every change this run carries (any repo), for reverts. */
export const loadCarriedChanges = async (client: CanonicalDataClient, run: AgentRun): Promise<ConventionChange[]> => {
  const targets = await loadRepoTargets(client, run);
  return [...new Map(targets.flatMap((target) => target.changes).map((change) => [change.id, change])).values()];
};

/** This run's template PR in one repo, if it opened one. */
export const findRunTemplateChange = async (client: CanonicalDataClient, run: AgentRun, repo: string): Promise<TemplateChange | null> => {
  if (run.template_change_ids.length === 0) return null;
  const rows = await listTemplateChanges(client, { ids: run.template_change_ids });
  return rows.find((row) => row.repo_full_name === repo) ?? null;
};

/** Template source with edits applied (codegen/ files only). */
const withEdits = (source: TemplateSource, edits: Array<{ path: string; content: string }>): TemplateSource => {
  const files = new Map(source.files);
  let manifest: CodegenManifest = source.manifest;
  for (const edit of edits) {
    if (!edit.path.startsWith('codegen/')) continue;
    const relative = edit.path.slice('codegen/'.length);
    files.set(relative, edit.content);
    if (relative === 'manifest.json') manifest = JSON.parse(edit.content) as CodegenManifest;
  }
  return { ...source, sha: `${source.sha}+edits`, files, manifest };
};

const buildPrBody = (run: AgentRun, changes: ConventionChange[], summary: string): string =>
  [
    `**Code Control template agent** (run \`${run.id}\`)`,
    '',
    summary,
    '',
    '### Convention changes carried',
    ...changes.map((change) => `- \`${change.change_type}\` **${change.convention_key}**${change.reason ? `: ${change.reason}` : ''}`),
    '',
    'Approve or deny this PR from Code Control → Template agents (the run may have PRs in other template repos too), so the conventions ledger stays in sync.',
  ].join('\n');

/** What happened in one repo (stored in run.output.repos). */
export type TemplateRepoOutcome =
  | { status: 'pr'; summary: string; template_change_id: string; work_sha: string; commit_sha: string; files: Array<{ path: string; area: string; explanation: string; convention_keys: string[] }> }
  | { status: 'not_needed'; summary: string; reason: string }
  | { status: 'failed'; summary: string; error: string };

/**
 * One repo of a template run: picks the files it needs, edits codegen templates / scaffold / ADRs
 * for the changes that repo carries, checks the templates still render valid code for a sample
 * data model, and opens (or updates) that repo's PR.
 */
const runForRepo = async (
  client: CanonicalDataClient,
  run: AgentRun,
  target: TemplateRepoTarget,
  shared: { checks: Awaited<ReturnType<typeof loadFileChecks>>; sample: Awaited<ReturnType<typeof loadSampleDataModel>> },
): Promise<{ outcome: TemplateRepoOutcome; findings: AgentRunFinding[] }> => {
  const ref = parseRepoFullName(target.repo);
  const { changes } = target;
  const { checks, sample } = shared;

  // Revisions continue on the open PR's branch; fresh runs start from the default branch.
  const found = await findRunTemplateChange(client, run, target.repo);
  const existingChange = found && found.status === 'open' ? found : null;
  const head = await getDefaultBranchHead(ref);
  if (!head.ok || !head.head_sha) throw new Error(`${target.repo}: ${head.ok ? 'no commits' : head.error}`);
  const workSha = existingChange ? (await getBranchHeadSha(ref, existingChange.branch)) ?? head.head_sha : head.head_sha;

  const [paths, source] = await Promise.all([listTreePaths(ref, workSha), loadTemplateSource(ref, workSha).catch(() => null)]);
  const sourcePaths = (await Promise.all(changes.map((change) => (change.convention_id ? listConventionSources(client, change.convention_id) : Promise.resolve([])))))
    .flat()
    .filter((item) => item.repo === ref.repo || item.repo === target.repo)
    .map((item) => item.adr_path);

  const revision = run.revision_of_run_id ? await getAgentRunById(client, run.revision_of_run_id) : null;
  const previous = revision ? (revision.output.repos as Record<string, TemplateRepoOutcome> | undefined)?.[target.repo] : undefined;
  const feedback = String(run.input.revise_feedback ?? '').trim();
  const context = [
    `# Template repo: ${target.repo} (role ${target.role_key})`,
    existingChange ? `You are revising open PR #${existingChange.pr_number} on branch ${existingChange.branch}; files below are its current state.` : '',
    '',
    '# Convention changes to carry (already applied in the database)',
    describeCarriedChanges(changes),
    ...(feedback ? ['', '# Reviewer feedback on the previous attempt (may cover several template repos)', feedback, previous ? `Previous summary for this repo: ${previous.summary}` : ''] : []),
    ...(run.instructions.trim() ? ['', '# Extra instructions', run.instructions.trim()] : []),
    ...(sourcePaths.length > 0 ? ['', '# ADRs these conventions were sourced from', ...[...new Set(sourcePaths)].map((path) => `- ${path}`)] : []),
  ].join('\n');

  const repoName = ref.repo;
  const repoPaths = [...paths].filter((path) => !path.startsWith('codegen/')).sort();
  const select = await callAgentAi<TemplateSelectAnswer>(client, {
    runId: run.id,
    purpose: `template_select_files · ${repoName}`,
    configKey: 'template_agent_select',
    systemPrompt: TEMPLATE_SYSTEM_PROMPT,
    userMessage: [
      context,
      '',
      `# codegen/ files (you will get all of them)`,
      ...(source ? [...source.files.keys()].sort().map((path) => `- codegen/${path}`) : ['(this repo has no codegen/ yet)']),
      '',
      '# Other repo files',
      ...repoPaths.map((path) => `- ${path}`),
      '',
      `Pick up to ${MAX_TEMPLATE_FILES_TO_READ} files to read, or answer not_needed.`,
    ].join('\n'),
    schema: TEMPLATE_SELECT_SCHEMA,
  });

  const notNeeded = async (reason: string, summary: string) => {
    await updateConventionChangePropagations(client, { run_id: run.id, template_repo: target.repo, from_statuses: ['pending', 'in_run'], status: 'not_needed', reason });
    console.log('✅ [template-agent] No change needed', { runId: run.id, repo: target.repo });
    return { outcome: { status: 'not_needed' as const, summary, reason }, findings: [] };
  };
  if (select.decision === 'not_needed') return notNeeded(select.not_needed_reason, select.not_needed_reason);

  const wanted = [...new Set([...select.files_to_read.map((item) => item.path), ...sourcePaths, '.cursor/architecture/README.md'])]
    .filter((path) => paths.has(path) && !path.startsWith('codegen/'))
    .slice(0, MAX_TEMPLATE_FILES_TO_READ + sourcePaths.length + 1);
  const wantedContents = await Promise.all(wanted.map((path) => getFileText(ref, path, workSha)));
  let budget = MAX_PROMPT_FILE_CHARS;
  const fileBlocks: string[] = [];
  const currentContent = new Map<string, string>();
  const addBlock = (path: string, content: string) => {
    currentContent.set(path, content);
    if (content.length > budget) return;
    budget -= content.length;
    fileBlocks.push(fenceFile(path, content, ''));
  };
  if (source) for (const [path, content] of [...source.files.entries()].sort()) addBlock(`codegen/${path}`, content);
  wanted.forEach((path, index) => addBlock(path, wantedContents[index] ?? ''));

  const answer = await callAgentAi<TemplateEditAnswer>(client, {
    runId: run.id,
    purpose: `template_edit · ${repoName}`,
    configKey: 'template_agent',
    systemPrompt: TEMPLATE_SYSTEM_PROMPT,
    userMessage: [context, '', '# Files', ...fileBlocks].join('\n'),
    schema: TEMPLATE_EDIT_SCHEMA,
  });
  if (answer.decision === 'not_needed') return notNeeded(answer.not_needed_reason, answer.summary || answer.not_needed_reason);

  // Deterministic checks: allowed paths, manifest JSON, scaffold syntax, and a sample render.
  const findings: AgentRunFinding[] = [];
  const edits = answer.edits.map((edit) => ({ ...edit, content: keepTrailingNewline(currentContent.get(edit.path), edit.content) })).filter((edit) => {
    const bad = !edit.path.trim() || edit.path.startsWith('/') || edit.path.includes('..') || FORBIDDEN_PATH.test(edit.path);
    if (bad) findings.push({ severity: 'error', path: edit.path, message: 'Edit dropped: path is not allowed', convention_key: 'agent.scope' });
    return !bad && currentContent.get(edit.path) !== edit.content;
  });
  for (const edit of edits) {
    if (!paths.has(edit.path) && templateFileArea(edit.path) === 'scaffold') {
      findings.push({ severity: 'warning', path: edit.path, message: 'New scaffold file', convention_key: 'agent.scope' });
    }
    if (edit.path === 'codegen/manifest.json') {
      try {
        JSON.parse(edit.content);
      } catch (error) {
        findings.push({ severity: 'error', path: edit.path, message: `manifest.json is not valid JSON: ${error instanceof Error ? error.message : error}`, convention_key: 'codegen.template' });
      }
    }
    if (templateFileArea(edit.path) === 'scaffold') {
      for (const error of syntaxErrors(edit.path, edit.content)) findings.push({ severity: 'error', path: edit.path, message: `Syntax: ${error}`, convention_key: 'agent.syntax' });
    }
  }
  if (source && !findings.some((finding) => finding.path === 'codegen/manifest.json' && finding.severity === 'error')) {
    findings.push(...renderTemplateSample({ source: withEdits(source, edits), role: target.role_key, sample, checks }).findings);
  }
  if (edits.length === 0) return notNeeded('The agent proposed no effective edits', answer.summary);

  // Commit and open (or update) the PR.
  const branch = existingChange?.branch ?? templateBranchName(run.id);
  const keys = [...new Set(changes.map((change) => change.convention_key))];
  const title = existingChange?.title || `Conventions: ${titleFrom(keys.join(', '), 70)}`;
  const commitSha = await commitFilesToBranch({
    ref,
    baseSha: workSha,
    branch,
    message: `${title}\n\n${answer.summary}\n\nCode Control template agent run ${run.id} (v${run.version}).`,
    files: edits.map((edit) => ({ path: edit.path, content: edit.content })),
  });
  const pullRequest =
    (await findOpenPullRequest(ref, branch)) ??
    (await createPullRequest({ ref, head: branch, base: head.branch, title, body: buildPrBody(run, changes, answer.summary) }));

  const editedFiles: TemplateChangeFile[] = edits.map((edit) => ({ path: edit.path, action: paths.has(edit.path) ? 'update' : 'create', area: templateFileArea(edit.path) }));
  const mergedFiles = [...new Map([...(existingChange?.files ?? []), ...editedFiles].map((file) => [file.path, file])).values()];
  const changeId = existingChange?.id ?? (await createTemplateChange(client, { role_key: target.role_key, repo_full_name: target.repo, branch, base_branch: head.branch, base_sha: head.head_sha!, title })).id;
  await updateTemplateChange(client, changeId, { head_sha: commitSha, pr_number: pullRequest.number, pr_url: pullRequest.html_url, status: 'open', files: mergedFiles });
  await updateConventionChangePropagations(client, { run_id: run.id, template_repo: target.repo, from_statuses: ['pending'], status: 'in_run' });
  console.log('✅ [template-agent] Template PR ready', { runId: run.id, repo: target.repo, pr: pullRequest.number, files: edits.length, findings: findings.length });
  return {
    outcome: {
      status: 'pr',
      summary: answer.summary,
      template_change_id: changeId,
      work_sha: workSha,
      commit_sha: commitSha,
      files: edits.map((edit) => ({ path: edit.path, area: templateFileArea(edit.path), explanation: edit.explanation, convention_keys: edit.convention_keys })),
    },
    findings: findings.map((finding) => ({ ...finding, repo: target.repo })),
  };
};

/**
 * Executes a confirmed template agent run: one pass per affected template repo (each opens or
 * updates its own PR, or decides no change is needed there). A retry only redoes the repos that are
 * still pending. Ends in needs_review when any repo has a PR, failed when a repo failed (retry
 * picks those up), otherwise no_change.
 */
export const runTemplateAgent = async (client: CanonicalDataClient, run: AgentRun): Promise<void> => {
  const targets = await loadRepoTargets(client, run, ['pending']);
  const outcomes: Record<string, TemplateRepoOutcome> = { ...((run.output.repos as Record<string, TemplateRepoOutcome> | undefined) ?? {}) };
  const findings = (run.findings ?? []).filter((finding) => !targets.some((target) => target.repo === finding.repo));
  if (targets.length === 0 && Object.keys(outcomes).length === 0) throw new Error('This template run carries no convention changes');

  const [checks, sample] = await Promise.all([loadFileChecks(client), loadSampleDataModel(client, run.delivery_id)]);
  let changeIds = [...run.template_change_ids];
  for (const target of targets) {
    try {
      const result = await runForRepo(client, run, target, { checks, sample });
      outcomes[target.repo] = result.outcome;
      findings.push(...result.findings);
      if (result.outcome.status === 'pr' && !changeIds.includes(result.outcome.template_change_id)) {
        changeIds = [...changeIds, result.outcome.template_change_id];
        await updateAgentRun(client, run.id, { template_change_ids: changeIds });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ [template-agent] Repo failed', { runId: run.id, repo: target.repo, error: message });
      outcomes[target.repo] = { status: 'failed', summary: message, error: message };
    }
  }

  const entries = Object.entries(outcomes).sort(([a], [b]) => a.localeCompare(b));
  const failed = entries.filter(([, outcome]) => outcome.status === 'failed');
  const withPr = entries.filter(([, outcome]) => outcome.status === 'pr');
  const summary = entries.map(([repo, outcome]) => `${repo.split('/')[1] ?? repo}: ${outcome.status === 'not_needed' ? `no change (${outcome.reason})` : outcome.summary}`).join('\n');
  const status = failed.length > 0 ? 'failed' : withPr.length > 0 ? 'needs_review' : 'no_change';
  await updateAgentRun(
    client,
    run.id,
    {
      status,
      summary,
      findings,
      template_change_ids: changeIds,
      output: { ...run.output, sample: sample.label, repos: outcomes },
      error: failed.length > 0 ? failed.map(([repo, outcome]) => `${repo}: ${outcome.status === 'failed' ? outcome.error : ''}`).join('\n') : null,
      finished_at: new Date().toISOString(),
    },
    ['running'],
  );
  console.log('✅ [template-agent] Run finished', { runId: run.id, status, repos: entries.map(([repo, outcome]) => `${repo}=${outcome.status}`) });
};
