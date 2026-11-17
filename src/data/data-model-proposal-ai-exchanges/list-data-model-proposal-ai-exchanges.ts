import type { DataModelProposalAiExchangeSummary } from '../../model/data-model-proposal-ai-exchange';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists the AI calls made for a proposal (no prompt bodies). (Storage Express invoke)
 */
export const listDataModelProposalAiExchanges = async (
  client: CanonicalDataClient,
  proposalId: string,
): Promise<DataModelProposalAiExchangeSummary[]> =>
  invokeCanonicalDataOperation<DataModelProposalAiExchangeSummary[]>(client, 'listDataModelProposalAiExchanges', [proposalId]);
