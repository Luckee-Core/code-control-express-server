import type { AiExchange } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * One AI call with its bodies, or null. (Storage Express invoke)
 */
export const getAiExchangeById = async (
  client: CanonicalDataClient,
  id: string,
): Promise<AiExchange | null> =>
  invokeCanonicalDataOperation<AiExchange | null>(client, 'getAiExchangeById', [id]);
