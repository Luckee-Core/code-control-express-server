import { updateSystemBuildRun } from '../../data/system-build-runs';
import { listSystemBuildRunStepsByRunId, updateSystemBuildRunStep } from '../../data/system-build-run-steps';
import type { SystemBuildRun } from '../../model/system-build-run';
import type { CanonicalDataClient } from '../canonical-data-client';
import { STALE_RUNNING_MS } from './config';
import { recordSystemBuildEvent } from './record-system-build-event';
import { activeSystemBuildRuns } from './run-system-build';

/**
 * Marks a run failed when it is `running` with no job in this process and no update for a while
 * (the API restarted mid-run), so Continue can pick it up. Returns the run as it should be shown.
 */
export const settleStaleSystemBuildRun = async (client: CanonicalDataClient, run: SystemBuildRun): Promise<SystemBuildRun> => {
  if (run.status !== 'running' || activeSystemBuildRuns.has(run.id)) return run;
  if (Date.now() - new Date(run.updated_at).getTime() < STALE_RUNNING_MS) return run;
  const error = 'The build was interrupted (the API restarted). Press Continue to pick up where it stopped.';
  console.warn('⚠️ [system-build-runs] Marking interrupted run failed', { run: run.id });
  const steps = await listSystemBuildRunStepsByRunId(client, run.id);
  for (const step of steps.filter((item) => item.status === 'running')) {
    await updateSystemBuildRunStep(client, step.id, { status: 'failed', error, finished_at: new Date().toISOString() });
  }
  await recordSystemBuildEvent(client, { run_id: run.id, event_type: 'run_failed', message: error });
  return (await updateSystemBuildRun(client, run.id, { status: 'failed', error })) ?? run;
};
