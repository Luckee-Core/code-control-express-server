import type { DataModelDelivery } from '../../model/data-model-delivery';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists the deliveries (one per repo) for an approved proposal.
 */
export const listDataModelDeliveriesByProposalId = async (
  client: CanonicalDataClient,
  proposalId: string,
): Promise<DataModelDelivery[]> => invokeCanonicalDataOperation<DataModelDelivery[]>(client, 'listDataModelDeliveriesByProposalId', [proposalId]);
