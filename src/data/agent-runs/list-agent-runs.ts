import type { AgentRun, ListAgentRunsFilter } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists agent runs newest first. (Storage Express invoke)
 */
export const listAgentRuns = async (
  client: CanonicalDataClient,
  filter: ListAgentRunsFilter = {},
): Promise<AgentRun[]> =>
  invokeCanonicalDataOperation<AgentRun[]>(client, 'listAgentRuns', [filter]);
