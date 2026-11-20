import type { AgentRun } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * One agent run, or null. (Storage Express invoke)
 */
export const getAgentRunById = async (
  client: CanonicalDataClient,
  id: string,
): Promise<AgentRun | null> =>
  invokeCanonicalDataOperation<AgentRun | null>(client, 'getAgentRunById', [id]);
