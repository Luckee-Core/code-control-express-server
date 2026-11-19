import { updateDataModelDelivery } from '../../data/data-model-deliveries';
import type { DataModelDelivery } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import { getPullRequest } from '../github';

/**
 * Brings a delivery's status in line with its PR on GitHub. Covers `opened` rows (merged or
 * closed there) and `failed` rows that still point at a PR, e.g. a row a later attempt marked
 * failed although its PR was merged. Returns the delivery unchanged when it has no PR, is in a
 * final state, or GitHub can't be reached.
 */
export const syncDeliveryPullRequest = async (
  client: CanonicalDataClient,
  delivery: DataModelDelivery,
): Promise<DataModelDelivery> => {
  // pending/failed rows that still point at a PR can be stale (e.g. overwritten by outdated storage).
  const syncable = delivery.status === 'opened' || delivery.status === 'failed' || delivery.status === 'pending';
  if (!syncable || !delivery.pr_number || !delivery.repo_full_name.includes('/')) {
    return delivery;
  }
  try {
    const [owner, repo] = delivery.repo_full_name.split('/');
    const pullRequest = await getPullRequest({ owner, repo }, delivery.pr_number);
    const status = pullRequest.merged ? 'merged' : pullRequest.state === 'closed' ? 'closed' : 'opened';
    // A failed row whose PR is still open keeps its error (the last attempt did fail).
    if ((delivery.status === 'failed' || delivery.status === 'pending') && status === 'opened') return delivery;
    const branch = pullRequest.head_ref && pullRequest.head_ref !== delivery.branch ? pullRequest.head_ref : undefined;
    if (status === delivery.status && !branch) return delivery;
    return (await updateDataModelDelivery(client, delivery.id, { status, error: null, ...(branch ? { branch } : {}) })) ?? delivery;
  } catch (error) {
    console.warn('⚠️ [data-model-deliveries] Could not read PR state', {
      repo: delivery.repo_full_name,
      pr: delivery.pr_number,
      error: error instanceof Error ? error.message : error,
    });
    return delivery;
  }
};
