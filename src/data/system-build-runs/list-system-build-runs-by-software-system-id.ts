import type { SystemBuildRun } from '../../model/system-build-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists a software system's build runs, newest first.
 */
export const listSystemBuildRunsBySoftwareSystemId = async (
  client: CanonicalDataClient,
  softwareSystemId: string,
): Promise<SystemBuildRun[]> => invokeCanonicalDataOperation<SystemBuildRun[]>(client, 'listSystemBuildRunsBySoftwareSystemId', [softwareSystemId]);
