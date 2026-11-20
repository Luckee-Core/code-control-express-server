import { getAgentRunById, updateAgentRun } from '../../data/agent-runs';
import { listConventionChanges, recordProposedConventionChanges } from '../../data/convention-changes';
import { listPrAgentEdits } from '../../data/pr-agent-edits';
import type { AgentRun, AgentRunFinding } from '../../model/agent-run';
import { unifiedDiff } from '../../utils/text/unified-diff';
import { callAgentAi } from '../agent-runs/call-agent-ai';
import { MAX_PROMPT_FILE_CHARS } from '../agent-runs/config';
import type { CanonicalDataClient } from '../canonical-data-client';
import { buildConventionAgentSchema, type ConventionAgentAnswer } from './convention-agent-schema';
import { formatCatalogForPrompt, loadCatalog } from './convention-catalog';
import { normalizeConventionChange } from './normalize-convention-change';
import { validateConventionChange } from './validate-convention-change';

const SYSTEM_PROMPT = [
  'You are the convention agent in Code Control. A reviewer gave feedback on a generated pull request, and the PR agent changed the PR accordingly; the reviewer approved that change.',
  'Your job: decide whether the feedback reveals a missing, unclear, wrong or outdated house convention, and propose the smallest set of convention changes that would make future generated code come out right the first time.',
  '',
  'Rules:',
  '- Compare against the full catalog. Prefer refining an existing convention over creating a near-duplicate.',
  '- Set verdict honestly: new (nothing covers it), refines (tightens/clarifies cited_key), conflicts (contradicts cited_key; usually pair with deprecate or refine of that key), wrong_scope (belongs to another domain or role than the PR\'s).',
  '- Do not propose duplicates. If the feedback is already covered (the generator just broke an existing rule) or is specific to this project, answer decision no_change and explain, citing keys.',
  '- New keys are dotted lowercase and follow the pattern of the domain (e.g. api.svc.*, dm.*, web.*).',
  '- Use the approved diff for examples: the old code as an incorrect example, the new code as a correct one, trimmed to the relevant lines.',
  '- Severity: MUST/NEVER for hard rules, SHOULD/AVOID for strong defaults.',
].join('\n');

/**
 * Executes a confirmed convention agent run: reads the approved PR change and its feedback,
 * compares it with the catalog, and records proposed convention changes (needs_review) or
 * no_change. Nothing is applied here.
 */
export const runConventionAgent = async (client: CanonicalDataClient, run: AgentRun): Promise<void> => {
  const prRunId = String(run.input.pr_run_id ?? run.parent_run_id ?? '');
  const prRun = prRunId ? await getAgentRunById(client, prRunId) : null;
  if (!prRun) throw new Error('Convention agent run has no PR agent run to read');
  const edits = await listPrAgentEdits(client, prRun.id);
  const catalog = await loadCatalog(client);
  const pending = await listConventionChanges(client, { status: 'proposed', limit: 500 });
  const previous = run.revision_of_run_id
    ? await listConventionChanges(client, { source_type: 'convention_agent', source_id: run.revision_of_run_id, limit: 200 })
    : [];
  const reviseFeedback = String(run.input.revise_feedback ?? '').trim();

  let budget = MAX_PROMPT_FILE_CHARS;
  const diffs = edits.map((edit) => {
    const diff = unifiedDiff(edit.before_content ?? '', edit.after_content ?? '');
    const text = diff.length > budget ? `${diff.slice(0, Math.max(0, budget))}\n… (truncated)` : diff;
    budget = Math.max(0, budget - text.length);
    return `### ${edit.path}${edit.after_content === null ? ' (deleted)' : ''}\n${edit.explanation}\n\`\`\`diff\n${text}\n\`\`\``;
  });

  const userMessage = [
    `# Repo role: ${run.role_key ?? prRun.role_key ?? 'unknown'}`,
    '',
    '# Reviewer feedback',
    String(prRun.input.feedback ?? '').trim(),
    '',
    '# What the PR agent changed (approved)',
    prRun.summary,
    '',
    ...diffs,
    ...(run.instructions.trim() ? ['', '# Extra instructions from the reviewer', run.instructions.trim()] : []),
    ...(reviseFeedback || previous.length > 0
      ? [
          '',
          `# Your previous proposals (v${run.version - 1}) and the reviewer's response`,
          ...previous.map((row) => `- ${row.change_type} \`${row.convention_key}\` (${row.verdict ?? 'n/a'}): ${row.reason} → after: ${JSON.stringify(row.after)}`),
          reviseFeedback ? `Reviewer: ${reviseFeedback}` : '',
        ]
      : []),
    ...(pending.length > 0
      ? ['', '# Already proposed by other runs (pending review, do not repeat)', ...pending.map((row) => `- ${row.change_type} \`${row.convention_key}\`: ${row.reason}`)]
      : []),
    '',
    '# Convention catalog',
    formatCatalogForPrompt(catalog),
  ].join('\n');

  const answer = await callAgentAi<ConventionAgentAnswer>(client, {
    runId: run.id,
    purpose: 'convention_review',
    configKey: 'convention_agent',
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    schema: buildConventionAgentSchema({
      domainKeys: catalog.domains.map((domain) => domain.key),
      topicKeys: catalog.topics.map((topic) => topic.key),
      roleKeys: catalog.roles.map((role) => role.key),
    }),
  });

  const findings: AgentRunFinding[] = [];
  const proposals = answer.decision === 'changes'
    ? answer.changes
        .filter((change) => {
          if (change.verdict !== 'duplicate') return true;
          findings.push({ severity: 'warning', path: '', message: `Dropped duplicate of ${change.cited_key || change.convention_key}: ${change.reason}`, convention_key: change.cited_key });
          return false;
        })
        .map((change) => normalizeConventionChange(change, catalog, { source_id: run.id }))
    : [];

  const createKeys = new Set<string>();
  for (const proposal of proposals) {
    const errors = validateConventionChange({ id: '', ...proposal, cited_key: proposal.cited_key }, catalog, createKeys);
    if (proposal.change_type === 'create') createKeys.add(proposal.convention_key);
    for (const error of errors) findings.push({ severity: 'error', path: proposal.convention_key, message: error, convention_key: proposal.convention_key });
    const clash = pending.find((row) => row.convention_key === proposal.convention_key);
    if (clash) {
      findings.push({ severity: 'warning', path: proposal.convention_key, message: `Another run already proposes ${clash.change_type} for this key (pending review).`, convention_key: proposal.convention_key });
    }
  }

  if (proposals.length > 0) await recordProposedConventionChanges(client, proposals);
  await updateAgentRun(
    client,
    run.id,
    {
      status: proposals.length > 0 ? 'needs_review' : 'no_change',
      summary: answer.summary,
      findings,
      output: { no_change_reason: answer.no_change_reason, proposed_count: proposals.length },
      finished_at: new Date().toISOString(),
      error: null,
    },
    ['running'],
  );
  console.log('✅ [convention-agent] Review done', { runId: run.id, proposed: proposals.length });
};
