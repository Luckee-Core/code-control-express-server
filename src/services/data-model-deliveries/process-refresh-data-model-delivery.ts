import { getDataModelDeliveryById, updateDataModelDelivery } from '../../data/data-model-deliveries';
import type { DataModelDelivery } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';
import { getPullRequest } from '../github';

/**
 * Re-reads a delivery's PR from GitHub and stores open / merged / closed.
 */
export const processRefreshDataModelDelivery = async (
  client: CanonicalDataClient,
  id: string,
): Promise<DataModelDelivery> => {
  const delivery = await getDataModelDeliveryById(client, id);
  if (!delivery) {
    throw new ProposalRequestError(404, 'Delivery not found');
  }
  if (!delivery.pr_number || !delivery.repo_full_name.includes('/')) {
    return delivery;
  }
  const [owner, repo] = delivery.repo_full_name.split('/');
  const pullRequest = await getPullRequest({ owner, repo }, delivery.pr_number);
  const status = pullRequest.merged ? 'merged' : pullRequest.state === 'closed' ? 'closed' : 'opened';
  if (status === delivery.status) return delivery;
  return (await updateDataModelDelivery(client, id, { status })) ?? delivery;
};
