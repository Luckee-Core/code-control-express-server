import { listDataModelProposalsBySoftwareSystemId } from '../../data/data-model-proposals';
import type { DataModelProposal } from '../../model/data-model-proposal';
import type { CanonicalDataClient } from '../canonical-data-client';
import { settleStaleProposal, withoutSnapshot } from './settle-stale-proposal';

/**
 * Lists a software system's proposals (newest first), settling interrupted runs.
 */
export const processListDataModelProposals = async (
  client: CanonicalDataClient,
  softwareSystemId: string,
): Promise<DataModelProposal[]> => {
  const proposals = await listDataModelProposalsBySoftwareSystemId(client, softwareSystemId);
  const settled = await Promise.all(proposals.map((proposal) => settleStaleProposal(client, proposal)));
  return settled.map(withoutSnapshot);
};
