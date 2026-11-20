import { getAgentRunById, listAgentRuns } from '../../data/agent-runs';
import { getDataModelDeliveryById, updateDataModelDelivery } from '../../data/data-model-deliveries';
import { listPrAgentEdits } from '../../data/pr-agent-edits';
import type { AgentRun, TemplateChange } from '../../model/agent-run';
import type { DataModelDelivery } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { CodegenRole } from '../codegen';
import { loadDeliveryInputs } from '../data-model-deliveries/load-delivery-inputs';
import { readRepoHeadByFullName } from '../data-model-deliveries/read-repo-render-state';
import { renderDeliveryFiles } from '../data-model-deliveries/render-delivery-files';
import { getBranchHeadSha, getFileText } from '../github';
import { parseRepoFullName } from './run-template-agent';

/**
 * After a template change merges: re-renders the delivery the feedback came from with the merged
 * templates and compares the files the PR agent edited with what is on the PR. converged = the
 * templates now produce the reviewer's fix; diverged = they don't (the fix was project-specific,
 * or the template change missed something). Stored on the delivery; null when not applicable.
 */
export const checkConvergence = async (
  client: CanonicalDataClient,
  run: AgentRun,
  templateChange: TemplateChange,
  mergeSha: string,
): Promise<DataModelDelivery | null> => {
  const root = run.root_run_id ? await getAgentRunById(client, run.root_run_id) : null;
  if (!root || root.agent !== 'pr' || !root.delivery_id) return null;
  const delivery = await getDataModelDeliveryById(client, root.delivery_id);
  if (!delivery || delivery.role !== templateChange.role_key) return null;

  // Files the reviewer's approved PR agent runs changed in this chain.
  const prRuns = [root, ...(await listAgentRuns(client, { agent: 'pr', delivery_id: delivery.id, limit: 50 }))].filter(
    (item, index, list) => item.status === 'approved' && list.findIndex((other) => other.id === item.id) === index,
  );
  const edited = new Set((await Promise.all(prRuns.map((item) => listPrAgentEdits(client, item.id)))).flat().map((edit) => edit.path));
  if (edited.size === 0) return null;

  try {
    const inputs = await loadDeliveryInputs(client, delivery.proposal_id);
    const head = await readRepoHeadByFullName(delivery.repo_full_name);
    const rendered = await renderDeliveryFiles({
      client,
      kind: delivery.kind,
      role: delivery.role as CodegenRole,
      inputs,
      head,
      template: { ref: parseRepoFullName(templateChange.repo_full_name), sha: mergeSha },
    });
    const [owner, name] = delivery.repo_full_name.split('/');
    const target = { owner, repo: name };
    const prSha = (delivery.status === 'opened' ? await getBranchHeadSha(target, delivery.branch) : null) ?? delivery.commit_sha;
    const renderedByPath = new Map(rendered.files.map((file) => [file.path, file.content]));
    const differing: string[] = [];
    for (const path of edited) {
      const onPr = await getFileText(target, path, prSha);
      if ((renderedByPath.get(path) ?? null) !== onPr) differing.push(path);
    }
    return updateDataModelDelivery(client, delivery.id, {
      convergence: differing.length === 0 ? 'converged' : 'diverged',
      convergence_detail: { template_change_id: templateChange.id, template_sha: mergeSha, differing_paths: differing },
      convergence_checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('⚠️ [template-agent] Convergence check failed', { runId: run.id, error: error instanceof Error ? error.message : error });
    return null;
  }
};
