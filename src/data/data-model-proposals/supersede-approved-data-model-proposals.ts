import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Marks the other approved proposals of a software system as superseded. (Storage Express invoke)
 */
export const supersedeApprovedDataModelProposals = async (
  client: CanonicalDataClient,
  softwareSystemId: string,
  keepProposalId: string,
): Promise<{ superseded: number }> =>
  invokeCanonicalDataOperation<{ superseded: number }>(client, 'supersedeApprovedDataModelProposals', [softwareSystemId, keepProposalId]);
