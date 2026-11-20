import { updateAgentRun } from '../../data/agent-runs';
import { listConventionChanges } from '../../data/convention-changes';
import { insertConventionChangePropagations, listConventionChangePropagations, updateConventionChangePropagations } from '../../data/convention-change-propagations';
import { listTemplateChanges, updateTemplateChange } from '../../data/template-changes';
import type { AgentRun } from '../../model/agent-run';
import { AgentRequestError } from '../agent-runs/agent-request-error';
import type { CanonicalDataClient } from '../canonical-data-client';
import { closePullRequest, getPullRequest } from '../github';
import { revertConventionChange } from './revert-convention-change';
import { loadCarriedChanges, parseRepoFullName } from './run-template-agent';

/**
 * Denies a template agent run: closes its PR in every template repo, marks the carried changes as
 * denied, and (optionally) reverts those convention changes. A run carries every repo a change
 * needed, so no template received the change and the reverts need no template PR of their own.
 */
export const rejectTemplateAgentRun = async (
  client: CanonicalDataClient,
  run: AgentRun,
  input: { note: string; revert: boolean },
): Promise<{ run: AgentRun; reverted: number; notes: string[] }> => {
  const carried = await loadCarriedChanges(client, run);
  const templateChanges = run.template_change_ids.length > 0 ? await listTemplateChanges(client, { ids: run.template_change_ids }) : [];
  for (const change of templateChanges) {
    if (!change.pr_number || change.status !== 'open') continue;
    const ref = parseRepoFullName(change.repo_full_name);
    const pullRequest = await getPullRequest(ref, change.pr_number);
    if (pullRequest.merged) throw new AgentRequestError(409, `${change.repo_full_name}: the template PR is already merged on GitHub. Approve this run instead.`);
    if (pullRequest.state === 'open') {
      await closePullRequest({ ref, number: change.pr_number, comment: `Denied in Code Control${input.note ? `: ${input.note}` : '.'}` });
    }
    await updateTemplateChange(client, change.id, { status: 'closed' });
  }
  const propagations = await listConventionChangePropagations(client, { run_id: run.id });
  await updateConventionChangePropagations(client, { run_id: run.id, from_statuses: ['pending', 'in_run'], status: 'denied', reason: input.note });

  const rejected = await updateAgentRun(client, run.id, { status: 'rejected', decision_note: input.note, decided_at: new Date().toISOString() }, ['needs_review']);
  if (!rejected) throw new AgentRequestError(409, 'This run is no longer waiting for review');

  const notes: string[] = [];
  let reverted = 0;
  if (input.revert) {
    const context = { source_type: 'template_agent' as const, source_id: run.id, reason: `Revert: template change denied${input.note ? ` (${input.note})` : ''}` };
    for (const change of [...carried].filter((item) => item.status === 'applied').reverse()) {
      try {
        const note = await revertConventionChange(client, change, context);
        if (note) notes.push(note);
        else reverted += 1;
      } catch (error) {
        notes.push(`${change.convention_key}: ${error instanceof Error ? error.message : error}`);
      }
    }
    // Mark each revert as not needed in the repos this run covered, so the sweep doesn't pick it up.
    const repos = [...new Map(propagations.map((row) => [row.template_repo, row.role_key])).entries()];
    const reverts = await listConventionChanges(client, { source_type: 'template_agent', source_id: run.id, limit: 1000 });
    await insertConventionChangePropagations(
      client,
      reverts.flatMap((row) =>
        (repos.length > 0 ? repos : [['(none)', 'none'] as [string, string]]).map(([repo, role]) => ({
          convention_change_id: row.id,
          template_repo: repo,
          role_key: role,
          status: 'not_needed' as const,
          reason: 'Reverts a denied template change',
        })),
      ),
    );
  }
  console.log('✅ [template-agent] Template run denied', { runId: run.id, reverted, notes });
  return { run: rejected, reverted, notes };
};
