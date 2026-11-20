import { getAgentRunById } from '../../data/agent-runs';
import type { CanonicalDataClient } from '../canonical-data-client';
import { listTemplateRepos, loadTemplateSource } from '../codegen';
import { compareCommits, getDefaultBranchHead, getFileText, type GithubCompareFile } from '../github';
import { loadSampleDataModel, renderTemplateSample } from '../template-agent/render-template-sample';
import { findRunTemplateChange, parseRepoFullName, templateFileArea } from '../template-agent/run-template-agent';
import { AgentRequestError } from './agent-request-error';
import { loadFileChecks } from './load-file-checks';

type RepoOutput = { work_sha?: string; commit_sha?: string };

/** A template run's PR in one repo (`repo` = owner/name). */
const requireTemplateChange = async (client: CanonicalDataClient, runId: string, repo: string) => {
  const run = await getAgentRunById(client, runId);
  if (!run) throw new AgentRequestError(404, 'Agent run not found');
  if (run.agent !== 'template') throw new AgentRequestError(400, 'Only template runs have template PRs');
  if (!repo) throw new AgentRequestError(400, 'repo is required');
  const change = await findRunTemplateChange(client, run, repo);
  if (!change) throw new AgentRequestError(409, `This run has no template PR in ${repo}`);
  const output = ((run.output.repos as Record<string, RepoOutput> | undefined) ?? {})[repo] ?? {};
  return { run, change, output, ref: parseRepoFullName(change.repo_full_name) };
};

/**
 * Files changed by a template run's PR in one repo (whole PR) or by this version's commit there
 * (scope run), with patches.
 */
export const processGetTemplateRunDiff = async (
  client: CanonicalDataClient,
  runId: string,
  input: { repo: string; scope: 'pr' | 'run' },
): Promise<Array<GithubCompareFile & { area: string }>> => {
  const { change, output, ref } = await requireTemplateChange(client, runId, input.repo);
  const base = input.scope === 'run' ? output.work_sha ?? change.base_sha : change.base_sha;
  const head = input.scope === 'run' ? output.commit_sha ?? change.head_sha : change.head_sha;
  const files = await compareCommits(ref, base, head);
  return files.map((file) => ({ ...file, area: templateFileArea(file.filename) }));
};

/** Full content of one file of a template PR at its base or head. */
export const processGetTemplateRunFile = async (
  client: CanonicalDataClient,
  runId: string,
  input: { repo: string; path: string; at: 'base' | 'head' },
): Promise<{ path: string; at: string; sha: string; content: string | null }> => {
  const { change, ref } = await requireTemplateChange(client, runId, input.repo);
  const sha = input.at === 'base' ? change.base_sha : change.head_sha;
  return { path: input.path, at: input.at, sha, content: await getFileText(ref, input.path, sha) };
};

/**
 * What future projects get: renders the sample data model with one repo's template PR base and head
 * templates and returns the generated files that differ, plus findings on the head render.
 */
export const processGetTemplateRenderPreview = async (client: CanonicalDataClient, runId: string, repo: string) => {
  const { run, change, ref } = await requireTemplateChange(client, runId, repo);
  const [baseSource, headSource, sample, checks] = await Promise.all([
    loadTemplateSource(ref, change.base_sha).catch(() => null),
    loadTemplateSource(ref, change.head_sha),
    loadSampleDataModel(client, run.delivery_id),
    loadFileChecks(client),
  ]);
  const before = baseSource ? renderTemplateSample({ source: baseSource, role: change.role_key, sample, checks }) : { files: [], findings: [] };
  const after = renderTemplateSample({ source: headSource, role: change.role_key, sample, checks });
  const beforeByKey = new Map(before.files.map((file) => [`${file.kind}:${file.path}`, file.content]));
  const afterByKey = new Map(after.files.map((file) => [`${file.kind}:${file.path}`, file.content]));
  const keys = [...new Set([...beforeByKey.keys(), ...afterByKey.keys()])].sort();
  const files = keys
    .filter((key) => beforeByKey.get(key) !== afterByKey.get(key))
    .map((key) => {
      const [kind, ...rest] = key.split(':');
      return { kind, path: rest.join(':'), before: beforeByKey.get(key) ?? null, after: afterByKey.get(key) ?? null };
    });
  return { sample: sample.label, unchanged_count: keys.length - files.length, files, findings: after.findings };
};

let headsCache: { at: number; value: Array<{ role_key: string; repo: string; sha: string | null }> } | null = null;

/**
 * Current default-branch head of every template repo (cached a minute). The web compares it with a
 * delivery's template_sha to offer Re-render.
 */
export const processGetTemplateHeads = async (client: CanonicalDataClient) => {
  if (headsCache && Date.now() - headsCache.at < 60_000) return headsCache.value;
  const repos = await listTemplateRepos(client);
  const value = await Promise.all(
    repos.map(async (repo) => {
      const head = await getDefaultBranchHead(repo.ref);
      return { role_key: repo.role_key, repo: repo.full_name, sha: head.ok ? head.head_sha : null };
    }),
  );
  headsCache = { at: Date.now(), value };
  return value;
};
