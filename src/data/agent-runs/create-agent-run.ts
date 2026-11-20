import type { AgentRun, CreateAgentRunInput } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates an agent run (default status draft). (Storage Express invoke)
 */
export const createAgentRun = async (
  client: CanonicalDataClient,
  input: CreateAgentRunInput,
): Promise<AgentRun> =>
  invokeCanonicalDataOperation<AgentRun>(client, 'createAgentRun', [input]);
