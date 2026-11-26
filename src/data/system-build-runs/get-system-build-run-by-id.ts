import type { SystemBuildRun } from '../../model/system-build-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Gets one build run; null when not found.
 */
export const getSystemBuildRunById = async (
  client: CanonicalDataClient,
  id: string,
): Promise<SystemBuildRun | null> => invokeCanonicalDataOperation<SystemBuildRun | null>(client, 'getSystemBuildRunById', [id]);
