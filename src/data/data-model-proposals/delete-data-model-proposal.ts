import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Deletes a proposal (AI ledger rows cascade). (Storage Express invoke)
 */
export const deleteDataModelProposal = async (
  client: CanonicalDataClient,
  id: string,
): Promise<{ deleted: boolean }> =>
  invokeCanonicalDataOperation<{ deleted: boolean }>(client, 'deleteDataModelProposal', [id]);
