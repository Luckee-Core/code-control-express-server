import type { PrAgentEdit } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * A PR agent run's proposed edits in order. (Storage Express invoke)
 */
export const listPrAgentEdits = async (
  client: CanonicalDataClient,
  runId: string,
): Promise<PrAgentEdit[]> =>
  invokeCanonicalDataOperation<PrAgentEdit[]>(client, 'listPrAgentEdits', [runId]);
