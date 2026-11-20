import type { AgentRun, AgentRunStatus, UpdateAgentRunInput } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates an agent run; with fromStatuses only when it is in one of them (null otherwise). (Storage Express invoke)
 */
export const updateAgentRun = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateAgentRunInput,
  fromStatuses?: AgentRunStatus[],
): Promise<AgentRun | null> =>
  invokeCanonicalDataOperation<AgentRun | null>(client, 'updateAgentRun', [id, input, fromStatuses ?? null]);
