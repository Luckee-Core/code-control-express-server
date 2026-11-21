import { getDataModelDeliveryById, updateDataModelDelivery } from '../../data/data-model-deliveries';
import type { DataModelDelivery } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';
import { deleteBranch, getPullRequest, mergePullRequest } from '../github';

/**
 * Squash-merges a delivery's open PR on GitHub, deletes its branch and stores `merged`.
 * A PR already merged or closed on GitHub is just synced.
 */
export const processMergeDataModelDelivery = async (client: CanonicalDataClient, id: string): Promise<DataModelDelivery> => {
  const delivery = await getDataModelDeliveryById(client, id);
  if (!delivery) {
    throw new ProposalRequestError(404, 'Delivery not found');
  }
  if (!delivery.pr_number || !delivery.repo_full_name.includes('/')) {
    throw new ProposalRequestError(400, 'This delivery has no pull request to merge');
  }
  const [owner, repo] = delivery.repo_full_name.split('/');
  const ref = { owner, repo };
  const pullRequest = await getPullRequest(ref, delivery.pr_number);
  if (pullRequest.merged || pullRequest.state === 'closed') {
    const status = pullRequest.merged ? 'merged' : 'closed';
    return status === delivery.status ? delivery : ((await updateDataModelDelivery(client, id, { status })) ?? delivery);
  }
  const merged = await mergePullRequest({ ref, number: delivery.pr_number });
  if (!merged.ok) {
    throw new ProposalRequestError(409, `GitHub did not merge PR #${delivery.pr_number}: ${merged.error}`);
  }
  await deleteBranch(ref, pullRequest.head_ref);
  console.log('✅ [data-model-deliveries] Merged', { repo: delivery.repo_full_name, pr: delivery.pr_number });
  return (await updateDataModelDelivery(client, id, { status: 'merged', error: null })) ?? delivery;
};
