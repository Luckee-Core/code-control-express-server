import { listSystemBuildRunsBySoftwareSystemId } from '../../data/system-build-runs';
import type { SystemBuildRun } from '../../model/system-build-run';
import type { CanonicalDataClient } from '../canonical-data-client';
import { settleStaleSystemBuildRun } from './settle-stale-system-build-run';

/**
 * Lists a software system's build runs, newest first (interrupted runs settled).
 */
export const processListSystemBuildRuns = async (client: CanonicalDataClient, softwareSystemId: string): Promise<SystemBuildRun[]> => {
  const runs = await listSystemBuildRunsBySoftwareSystemId(client, softwareSystemId);
  return Promise.all(runs.map((run) => settleStaleSystemBuildRun(client, run)));
};
