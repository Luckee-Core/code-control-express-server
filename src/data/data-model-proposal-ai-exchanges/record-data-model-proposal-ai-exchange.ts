import type { RecordDataModelProposalAiExchangeInput } from '../../model/data-model-proposal-ai-exchange';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Records one AI request/response/exchange for a proposal. (Storage Express invoke)
 */
export const recordDataModelProposalAiExchange = async (
  client: CanonicalDataClient,
  input: RecordDataModelProposalAiExchangeInput,
): Promise<{ exchange_id: string; request_id: string; response_id: string }> =>
  invokeCanonicalDataOperation<{ exchange_id: string; request_id: string; response_id: string }>(client, 'recordDataModelProposalAiExchange', [input]);
