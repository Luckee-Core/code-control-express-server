import type { AiExchangeSummary, RecordAiExchangeInput } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Records one AI call for an agent run. (Storage Express invoke)
 */
export const recordAiExchange = async (
  client: CanonicalDataClient,
  input: RecordAiExchangeInput,
): Promise<AiExchangeSummary> =>
  invokeCanonicalDataOperation<AiExchangeSummary>(client, 'recordAiExchange', [input]);
