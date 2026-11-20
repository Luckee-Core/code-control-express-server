import { getAgentRunById, listAgentRuns, updateAgentRun } from '../../data/agent-runs';
import { listPrAgentEdits, replacePrAgentEdits } from '../../data/pr-agent-edits';
import type { AgentRun } from '../../model/agent-run';
import { callAgentAi } from '../agent-runs/call-agent-ai';
import { checkEditedFiles } from '../agent-runs/check-edited-files';
import { keepTrailingNewline } from '../agent-runs/file-text';
import { loadFileChecks } from '../agent-runs/load-file-checks';
import { loadRoleConventionsText } from '../agent-runs/load-role-conventions';
import type { CanonicalDataClient } from '../canonical-data-client';
import { buildPrAgentSystemPrompt, buildPrAgentUserMessage, PR_AGENT_SCHEMA, type PrAgentAnswer } from './build-pr-agent-prompt';
import { readDeliveryPr } from './read-delivery-pr';

/** Earlier versions of this run (oldest first), for the revise loop. */
const loadPreviousVersions = async (client: CanonicalDataClient, run: AgentRun) => {
  const chain: AgentRun[] = [];
  let cursor = run.revision_of_run_id;
  while (cursor) {
    const previous = await getAgentRunById(client, cursor);
    if (!previous) break;
    chain.unshift(previous);
    cursor = previous.revision_of_run_id;
  }
  return Promise.all(chain.map(async (item) => ({ run: item, edits: await listPrAgentEdits(client, item.id) })));
};

/**
 * Executes a confirmed PR agent run: reads the PR at its branch head, asks the AI for edits,
 * checks them and stores them for review (needs_review). Nothing is committed here.
 */
export const runPrAgent = async (client: CanonicalDataClient, run: AgentRun): Promise<void> => {
  if (!run.delivery_id) throw new Error('PR agent run has no delivery');
  const feedback = String(run.input.feedback ?? '').trim();
  const focusPaths = Array.isArray(run.input.focus_paths) ? (run.input.focus_paths as string[]) : [];
  if (!feedback) throw new Error('PR agent run has no feedback');

  const pr = await readDeliveryPr(client, run.delivery_id, focusPaths);
  const [conventionsText, previous, checks] = await Promise.all([
    loadRoleConventionsText(client, pr.delivery.role),
    loadPreviousVersions(client, run),
    loadFileChecks(client),
  ]);

  const answer = await callAgentAi<PrAgentAnswer>(client, {
    runId: run.id,
    purpose: 'pr_edit',
    configKey: 'pr_agent',
    systemPrompt: buildPrAgentSystemPrompt(conventionsText),
    userMessage: buildPrAgentUserMessage({ run, pr, feedback, focusPaths, previous }),
    schema: PR_AGENT_SCHEMA,
  });

  const before = new Map(pr.files.map((file) => [file.path, file.content]));
  const edits = answer.edits
    .filter((edit) => edit.path.trim() && !edit.path.startsWith('/') && !edit.path.includes('..'))
    .map((edit) => ({ ...edit, content: keepTrailingNewline(before.get(edit.path), edit.content) }))
    .filter((edit) => before.get(edit.path) !== edit.content);
  const known = new Set(pr.delivery.files.map((file) => file.path));
  const findings = checkEditedFiles({ role: pr.delivery.role, files: edits, checks, known });

  await replacePrAgentEdits(
    client,
    run.id,
    edits.map((edit) => ({ path: edit.path, before_content: before.get(edit.path) ?? null, after_content: edit.content, explanation: edit.explanation })),
  );
  const done = await updateAgentRun(
    client,
    run.id,
    {
      status: edits.length === 0 ? 'no_change' : 'needs_review',
      summary: answer.summary,
      findings,
      output: { base_sha: pr.head_sha, notes: answer.notes, omitted_files: pr.omitted, edit_count: edits.length },
      finished_at: new Date().toISOString(),
      error: null,
    },
    ['running'],
  );
  if (!done) console.warn('⚠️ [pr-agent] Run left running state before it finished', { runId: run.id });
  console.log('✅ [pr-agent] Proposed edits ready', { runId: run.id, edits: edits.length, findings: findings.length });
};

/** Latest PR agent run per delivery (for the Data access rows). */
export const listLatestPrRunsByDelivery = async (client: CanonicalDataClient, deliveryIds: string[]): Promise<Record<string, AgentRun>> => {
  const result: Record<string, AgentRun> = {};
  await Promise.all(
    deliveryIds.map(async (deliveryId) => {
      const [latest] = await listAgentRuns(client, { agent: 'pr', delivery_id: deliveryId, limit: 1 });
      if (latest) result[deliveryId] = latest;
    }),
  );
  return result;
};
