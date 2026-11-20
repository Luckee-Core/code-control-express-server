import type { PrAgentEdit, PrAgentEditInput } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Replaces a PR agent run's proposed edits. (Storage Express invoke)
 */
export const replacePrAgentEdits = async (
  client: CanonicalDataClient,
  runId: string,
  edits: PrAgentEditInput[],
): Promise<PrAgentEdit[]> =>
  invokeCanonicalDataOperation<PrAgentEdit[]>(client, 'replacePrAgentEdits', [runId, edits]);
