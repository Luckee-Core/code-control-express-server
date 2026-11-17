import type { DataModelProposal } from '../../model/data-model-proposal';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists a software system's proposals, newest version first. (Storage Express invoke)
 */
export const listDataModelProposalsBySoftwareSystemId = async (
  client: CanonicalDataClient,
  softwareSystemId: string,
): Promise<DataModelProposal[]> =>
  invokeCanonicalDataOperation<DataModelProposal[]>(client, 'listDataModelProposalsBySoftwareSystemId', [softwareSystemId]);
