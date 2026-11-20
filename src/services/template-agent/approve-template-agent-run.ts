import { updateAgentRun } from '../../data/agent-runs';
import { updateConventionChangePropagations } from '../../data/convention-change-propagations';
import { listTemplateChanges, updateTemplateChange } from '../../data/template-changes';
import type { AgentRun } from '../../model/agent-run';
import { AgentRequestError } from '../agent-runs/agent-request-error';
import type { CanonicalDataClient } from '../canonical-data-client';
import { deleteBranch, getPullRequest, mergePullRequest } from '../github';
import { checkConvergence } from './check-convergence';
import { parseRepoFullName } from './run-template-agent';

/**
 * Approves a template agent run: squash-merges its PR in every template repo, marks the carried
 * changes as merged into each repo, and checks whether the merged templates reproduce the original
 * fix. PRs that already merged are skipped, so approving again after a failed merge finishes the rest.
 */
export const approveTemplateAgentRun = async (client: CanonicalDataClient, run: AgentRun, note: string): Promise<{ run: AgentRun; next: AgentRun[] }> => {
  const templateChanges = run.template_change_ids.length > 0 ? await listTemplateChanges(client, { ids: run.template_change_ids }) : [];
  const open = templateChanges.filter((change) => change.status === 'open' || change.status === 'merged');
  if (open.length === 0) throw new AgentRequestError(409, 'This run has no template PRs');

  const merged: Array<{ repo: string; mergeSha: string; convergence: string | null; differingPaths: string[] }> = [];
  for (const change of open) {
    if (!change.pr_number) throw new AgentRequestError(409, `${change.repo_full_name}: template PR not found`);
    const ref = parseRepoFullName(change.repo_full_name);
    let pullRequest = await getPullRequest(ref, change.pr_number);
    if (!pullRequest.merged) {
      const done = merged.length > 0 ? ` Already merged: ${merged.map((item) => item.repo).join(', ')}.` : '';
      if (pullRequest.state === 'closed') throw new AgentRequestError(409, `${change.repo_full_name}: the template PR was closed on GitHub. Revise or deny this run.${done}`);
      const result = await mergePullRequest({ ref, number: change.pr_number, title: change.title });
      if (!result.ok) throw new AgentRequestError(409, `${change.repo_full_name}: GitHub did not merge the template PR: ${result.error}.${done} Approve again to retry.`);
      pullRequest = await getPullRequest(ref, change.pr_number);
      await deleteBranch(ref, change.branch);
    }
    const mergeSha = pullRequest.merge_commit_sha ?? change.head_sha;
    const updated = (await updateTemplateChange(client, change.id, { status: 'merged', merge_sha: mergeSha })) ?? change;
    await updateConventionChangePropagations(client, { run_id: run.id, template_repo: change.repo_full_name, from_statuses: ['pending', 'in_run'], status: 'merged' });
    const delivery = await checkConvergence(client, run, updated, mergeSha);
    merged.push({
      repo: change.repo_full_name,
      mergeSha,
      convergence: delivery?.convergence ?? null,
      differingPaths: ((delivery?.convergence_detail as { differing_paths?: string[] } | null)?.differing_paths) ?? [],
    });
  }

  const approved = await updateAgentRun(
    client,
    run.id,
    { status: 'approved', decision_note: note, decided_at: new Date().toISOString(), output: { ...run.output, merged } },
    ['needs_review'],
  );
  if (!approved) throw new AgentRequestError(409, 'This run is no longer waiting for review');
  console.log('✅ [template-agent] Template PRs merged', { runId: run.id, merged });
  return { run: approved, next: [] };
};
