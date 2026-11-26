import type { SystemBuildRunEvent } from '../../model/system-build-run-event';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists a build run's log, oldest first.
 */
export const listSystemBuildRunEventsByRunId = async (
  client: CanonicalDataClient,
  runId: string,
): Promise<SystemBuildRunEvent[]> => invokeCanonicalDataOperation<SystemBuildRunEvent[]>(client, 'listSystemBuildRunEventsByRunId', [runId]);
