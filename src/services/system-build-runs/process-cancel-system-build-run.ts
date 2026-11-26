import { getSystemBuildRunById, updateSystemBuildRun } from '../../data/system-build-runs';
import type { CanonicalDataClient } from '../canonical-data-client';
import { loadSystemBuildRunDetail } from './load-system-build-run-detail';
import { recordSystemBuildEvent } from './record-system-build-event';
import { SystemBuildRequestError } from './system-build-request-error';
import type { SystemBuildRunDetail } from './types';

/**
 * Cancels a run. A step already delivering finishes (its PRs stay as they are); no further step starts.
 */
export const processCancelSystemBuildRun = async (client: CanonicalDataClient, id: string): Promise<SystemBuildRunDetail> => {
  const run = await getSystemBuildRunById(client, id);
  if (!run) throw new SystemBuildRequestError(404, 'Build run not found');
  if (run.status === 'completed' || run.status === 'cancelled') {
    throw new SystemBuildRequestError(409, `This build is already ${run.status}.`);
  }
  const cancelled =
    (await updateSystemBuildRun(client, run.id, { status: 'cancelled', current_kind: null, finished_at: new Date().toISOString() })) ?? run;
  await recordSystemBuildEvent(client, { run_id: run.id, event_type: 'cancelled', message: 'Cancelled. PRs already merged stay merged.' });
  return loadSystemBuildRunDetail(client, cancelled);
};
