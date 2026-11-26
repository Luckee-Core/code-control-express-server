import { getActiveSystemBuildRunBySoftwareSystemId, getSystemBuildRunById, updateSystemBuildRun } from '../../data/system-build-runs';
import type { CanonicalDataClient } from '../canonical-data-client';
import { loadSystemBuildRunDetail } from './load-system-build-run-detail';
import { recordSystemBuildEvent } from './record-system-build-event';
import { activeSystemBuildRuns, startSystemBuildRun } from './run-system-build';
import { settleStaleSystemBuildRun } from './settle-stale-system-build-run';
import { SystemBuildRequestError } from './system-build-request-error';
import type { SystemBuildRunDetail } from './types';

/**
 * Picks a paused or failed run up at the step that stopped it. That step runs again through the
 * delivery code, which skips repos already merged and retries the merge of PRs still open.
 */
export const processContinueSystemBuildRun = async (client: CanonicalDataClient, id: string): Promise<SystemBuildRunDetail> => {
  const found = await getSystemBuildRunById(client, id);
  if (!found) throw new SystemBuildRequestError(404, 'Build run not found');
  const run = await settleStaleSystemBuildRun(client, found);
  if (run.status === 'running' && activeSystemBuildRuns.has(run.id)) {
    throw new SystemBuildRequestError(409, 'This build is already running.');
  }
  if (run.status === 'completed' || run.status === 'cancelled') {
    throw new SystemBuildRequestError(409, `This build is ${run.status}. Start a new one instead.`);
  }
  const active = await getActiveSystemBuildRunBySoftwareSystemId(client, run.software_system_id);
  if (active && active.id !== run.id) {
    throw new SystemBuildRequestError(409, 'Another build is running for this project. Cancel it first.');
  }

  const resumed = (await updateSystemBuildRun(client, run.id, { status: 'running', error: null, finished_at: null })) ?? run;
  await recordSystemBuildEvent(client, { run_id: run.id, event_type: 'continued', message: 'Continuing from the step that stopped.' });
  startSystemBuildRun(client, run.id);
  return loadSystemBuildRunDetail(client, resumed);
};
