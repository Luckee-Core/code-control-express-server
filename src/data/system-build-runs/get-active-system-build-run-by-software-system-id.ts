import type { SystemBuildRun } from '../../model/system-build-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * The software system's running or paused build run; null when none.
 */
export const getActiveSystemBuildRunBySoftwareSystemId = async (
  client: CanonicalDataClient,
  softwareSystemId: string,
): Promise<SystemBuildRun | null> => invokeCanonicalDataOperation<SystemBuildRun | null>(client, 'getActiveSystemBuildRunBySoftwareSystemId', [softwareSystemId]);
