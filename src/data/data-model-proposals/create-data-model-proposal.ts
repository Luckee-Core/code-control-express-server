import type { CreateDataModelProposalInput, DataModelProposal } from '../../model/data-model-proposal';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates the next proposal version (status running). (Storage Express invoke)
 */
export const createDataModelProposal = async (
  client: CanonicalDataClient,
  input: CreateDataModelProposalInput,
): Promise<DataModelProposal> =>
  invokeCanonicalDataOperation<DataModelProposal>(client, 'createDataModelProposal', [input]);
