import { updateDataModelDelivery } from '../../data/data-model-deliveries';
import type { DataModelDelivery } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import { getPullRequest } from '../github';

/**
 * Brings an `opened` delivery's status in line with its PR on GitHub (merged or closed there).
 * Returns the delivery unchanged when it has no PR, is not open, or GitHub can't be reached.
 */
export const syncDeliveryPullRequest = async (
  client: CanonicalDataClient,
  delivery: DataModelDelivery,
): Promise<DataModelDelivery> => {
  if (delivery.status !== 'opened' || !delivery.pr_number || !delivery.repo_full_name.includes('/')) {
    return delivery;
  }
  try {
    const [owner, repo] = delivery.repo_full_name.split('/');
    const pullRequest = await getPullRequest({ owner, repo }, delivery.pr_number);
    const status = pullRequest.merged ? 'merged' : pullRequest.state === 'closed' ? 'closed' : 'opened';
    if (status === delivery.status) return delivery;
    return (await updateDataModelDelivery(client, delivery.id, { status, error: null })) ?? delivery;
  } catch (error) {
    console.warn('⚠️ [data-model-deliveries] Could not read PR state', {
      repo: delivery.repo_full_name,
      pr: delivery.pr_number,
      error: error instanceof Error ? error.message : error,
    });
    return delivery;
  }
};
