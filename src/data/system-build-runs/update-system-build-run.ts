import type { SystemBuildRun, UpdateSystemBuildRunInput } from '../../model/system-build-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a build run; null when not found.
 */
export const updateSystemBuildRun = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateSystemBuildRunInput,
): Promise<SystemBuildRun | null> => invokeCanonicalDataOperation<SystemBuildRun | null>(client, 'updateSystemBuildRun', [id, input]);
