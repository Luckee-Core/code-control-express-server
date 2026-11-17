import { updateDataModelProposal } from '../../data/data-model-proposals';
import type { DataModelProposal } from '../../model/data-model-proposal';
import type { CanonicalDataClient } from '../canonical-data-client';
import { STALE_RUNNING_MS } from './config';
import { activeProposalRuns } from './run-proposal-generation';

/**
 * Marks a proposal failed when it has been `running` too long and no run is active in this
 * process (Express restarted mid-generation). Returns the proposal as it should be shown.
 */
export const settleStaleProposal = async (
  client: CanonicalDataClient,
  proposal: DataModelProposal,
): Promise<DataModelProposal> => {
  if (proposal.status !== 'running' || activeProposalRuns.has(proposal.id)) {
    return proposal;
  }
  const age = Date.now() - new Date(proposal.updated_at).getTime();
  if (age < STALE_RUNNING_MS) {
    return proposal;
  }
  console.warn('⚠️ [data-model-proposals] Marking interrupted proposal failed', { proposal_id: proposal.id });
  return updateDataModelProposal(client, proposal.id, {
    status: 'failed',
    error: 'Generation was interrupted (the API restarted). Generate again or revise.',
  });
};

/** Drops the large conventions snapshot before a proposal is sent to the browser. */
export const withoutSnapshot = (proposal: DataModelProposal): DataModelProposal => {
  const { conventions_snapshot: _snapshot, ...rest } = proposal;
  return rest;
};
