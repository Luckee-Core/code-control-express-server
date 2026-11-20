import { createAgentRun, updateAgentRun } from '../../data/agent-runs';
import { updateDataModelDelivery } from '../../data/data-model-deliveries';
import { listPrAgentEdits } from '../../data/pr-agent-edits';
import type { AgentRun } from '../../model/agent-run';
import { AgentRequestError } from '../agent-runs/agent-request-error';
import { titleFrom } from '../agent-runs/config';
import type { CanonicalDataClient } from '../canonical-data-client';
import { commentOnPullRequest, commitFilesToBranch, getFileText } from '../github';
import { readDeliveryPr } from './read-delivery-pr';

/**
 * Approves a PR agent run: commits its edits on top of the PR branch (refusing when a file
 * changed since the agent read it), then creates the convention agent run as a draft.
 */
export const approvePrAgentRun = async (client: CanonicalDataClient, run: AgentRun, note: string): Promise<{ run: AgentRun; next: AgentRun[] }> => {
  if (!run.delivery_id) throw new AgentRequestError(409, 'PR agent run has no delivery');
  const edits = await listPrAgentEdits(client, run.id);
  if (edits.length === 0) throw new AgentRequestError(409, 'This run has no edits to commit');

  const pr = await readDeliveryPr(client, run.delivery_id);
  const current = await Promise.all(edits.map((edit) => getFileText(pr.ref, edit.path, pr.head_sha)));
  const changed = edits.filter((edit, index) => (current[index] ?? null) !== edit.before_content).map((edit) => edit.path);
  if (changed.length > 0) {
    throw new AgentRequestError(409, `The PR changed since the agent read it (${changed.join(', ')}). Use Revise to run the agent again on the latest code.`);
  }

  const feedback = String(run.input.feedback ?? '');
  const commitSha = await commitFilesToBranch({
    ref: pr.ref,
    baseSha: pr.head_sha,
    branch: pr.delivery.branch,
    message: `PR feedback: ${titleFrom(feedback, 60)}\n\n${run.summary}\n\nApplied by Code Control PR agent run ${run.id}.`,
    files: edits.map((edit) => ({ path: edit.path, content: edit.after_content })),
  });
  await updateDataModelDelivery(client, pr.delivery.id, { commit_sha: commitSha });
  if (pr.delivery.pr_number) {
    await commentOnPullRequest(pr.ref, pr.delivery.pr_number, `**Code Control PR agent** applied feedback in ${commitSha.slice(0, 7)}:\n\n> ${feedback.trim().split('\n').join('\n> ')}\n\n${run.summary}`);
  }

  const approved = await updateAgentRun(
    client,
    run.id,
    { status: 'approved', decision_note: note, decided_at: new Date().toISOString(), output: { ...run.output, commit_sha: commitSha } },
    ['needs_review'],
  );
  if (!approved) throw new AgentRequestError(409, 'This run is no longer waiting for review');

  const convention = await createAgentRun(client, {
    agent: 'convention',
    parent_run_id: run.id,
    root_run_id: run.root_run_id ?? run.id,
    software_system_id: run.software_system_id,
    delivery_id: run.delivery_id,
    role_key: run.role_key,
    title: `Conventions from: ${titleFrom(feedback)}`,
    input: { pr_run_id: run.id },
  });
  console.log('✅ [pr-agent] Committed and handed off', { runId: run.id, commit: commitSha, next: convention.id });
  return { run: approved, next: [convention] };
};
