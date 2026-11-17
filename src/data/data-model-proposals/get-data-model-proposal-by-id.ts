import type { DataModelProposal } from '../../model/data-model-proposal';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Returns one proposal (with conventions_snapshot) or null. (Storage Express invoke)
 */
export const getDataModelProposalById = async (
  client: CanonicalDataClient,
  id: string,
): Promise<DataModelProposal | null> =>
  invokeCanonicalDataOperation<DataModelProposal | null>(client, 'getDataModelProposalById', [id]);
