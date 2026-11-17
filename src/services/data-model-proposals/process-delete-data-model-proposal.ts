import { deleteDataModelProposal } from '../../data/data-model-proposals';
import type { CanonicalDataClient } from '../canonical-data-client';
import { ProposalRequestError } from './proposal-request-error';
import { activeProposalRuns } from './run-proposal-generation';

/**
 * Deletes a proposal version and its AI ledger rows (not while it is generating here).
 */
export const processDeleteDataModelProposal = async (
  client: CanonicalDataClient,
  id: string,
): Promise<{ id: string }> => {
  if (activeProposalRuns.has(id)) {
    throw new ProposalRequestError(409, 'This proposal is still generating');
  }
  const result = await deleteDataModelProposal(client, id);
  if (!result.deleted) {
    throw new ProposalRequestError(404, 'Proposal not found');
  }
  return { id };
};
