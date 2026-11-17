import type { DataModelProposal, UpdateDataModelProposalInput } from '../../model/data-model-proposal';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a proposal. (Storage Express invoke)
 */
export const updateDataModelProposal = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateDataModelProposalInput,
): Promise<DataModelProposal> =>
  invokeCanonicalDataOperation<DataModelProposal>(client, 'updateDataModelProposal', [id, input]);
