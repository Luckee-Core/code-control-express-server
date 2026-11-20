import type { AiExchangeSummary } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * A run's AI calls without prompt/response bodies. (Storage Express invoke)
 */
export const listAiExchanges = async (
  client: CanonicalDataClient,
  runId: string,
): Promise<AiExchangeSummary[]> =>
  invokeCanonicalDataOperation<AiExchangeSummary[]>(client, 'listAiExchanges', [runId]);
