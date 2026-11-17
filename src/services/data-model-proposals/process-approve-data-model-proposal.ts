import {
  getDataModelProposalById,
  supersedeApprovedDataModelProposals,
  updateDataModelProposal,
} from '../../data/data-model-proposals';
import type { DataModelProposal } from '../../model/data-model-proposal';
import type { CanonicalDataClient } from '../canonical-data-client';
import { ProposalRequestError } from './proposal-request-error';
import { withoutSnapshot } from './settle-stale-proposal';

/**
 * Approves a finished proposal; any previously approved version becomes superseded.
 */
export const processApproveDataModelProposal = async (
  client: CanonicalDataClient,
  id: string,
): Promise<DataModelProposal> => {
  const proposal = await getDataModelProposalById(client, id);
  if (!proposal) {
    throw new ProposalRequestError(404, 'Proposal not found');
  }
  if (proposal.status === 'approved') {
    return withoutSnapshot(proposal);
  }
  if (!proposal.proposal || (proposal.status !== 'ready' && proposal.status !== 'superseded')) {
    throw new ProposalRequestError(409, `Only a finished proposal can be approved (status: ${proposal.status})`);
  }

  const approved = await updateDataModelProposal(client, id, {
    status: 'approved',
    approved_at: new Date().toISOString(),
  });
  await supersedeApprovedDataModelProposals(client, proposal.software_system_id, id);
  return withoutSnapshot(approved);
};
