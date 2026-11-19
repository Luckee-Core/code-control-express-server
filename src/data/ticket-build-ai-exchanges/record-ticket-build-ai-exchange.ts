import type { RecordTicketBuildAiExchangeInput } from '../../model/ticket-build-ai-exchange';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Records one AI call (request + response + exchange).
 */
export const recordTicketBuildAiExchange = async (
  client: CanonicalDataClient,
  input: RecordTicketBuildAiExchangeInput,
): Promise<{ exchange_id: string; request_id: string; response_id: string }> => invokeCanonicalDataOperation<{ exchange_id: string; request_id: string; response_id: string }>(client, 'recordTicketBuildAiExchange', [input]);
