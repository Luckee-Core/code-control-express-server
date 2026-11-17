import { listDataModelProposalAiExchanges } from '../../data/data-model-proposal-ai-exchanges';
import { getDataModelProposalById } from '../../data/data-model-proposals';
import type { CanonicalDataClient } from '../canonical-data-client';
import { settleStaleProposal, withoutSnapshot } from './settle-stale-proposal';
import type { DataModelProposalDetail } from './types';

/**
 * Loads one proposal plus its AI call summaries (null when not found).
 */
export const processGetDataModelProposal = async (
  client: CanonicalDataClient,
  id: string,
): Promise<DataModelProposalDetail | null> => {
  const proposal = await getDataModelProposalById(client, id);
  if (!proposal) return null;
  const [settled, exchanges] = await Promise.all([
    settleStaleProposal(client, proposal),
    listDataModelProposalAiExchanges(client, id),
  ]);
  return { proposal: withoutSnapshot(settled), exchanges };
};
