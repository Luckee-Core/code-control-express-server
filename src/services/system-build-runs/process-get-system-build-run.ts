import { getSystemBuildRunById } from '../../data/system-build-runs';
import type { CanonicalDataClient } from '../canonical-data-client';
import { loadSystemBuildRunDetail } from './load-system-build-run-detail';
import { settleStaleSystemBuildRun } from './settle-stale-system-build-run';
import { SystemBuildRequestError } from './system-build-request-error';
import type { SystemBuildRunDetail } from './types';

/**
 * Loads a run with its steps and log (the polling target); settles a run interrupted by a restart.
 */
export const processGetSystemBuildRun = async (client: CanonicalDataClient, id: string): Promise<SystemBuildRunDetail> => {
  const found = await getSystemBuildRunById(client, id);
  if (!found) throw new SystemBuildRequestError(404, 'Build run not found');
  return loadSystemBuildRunDetail(client, await settleStaleSystemBuildRun(client, found));
};
