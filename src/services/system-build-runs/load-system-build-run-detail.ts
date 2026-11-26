import { listSystemBuildRunEventsByRunId } from '../../data/system-build-run-events';
import { listSystemBuildRunStepsByRunId } from '../../data/system-build-run-steps';
import type { SystemBuildRun } from '../../model/system-build-run';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { SystemBuildRunDetail } from './types';

/** The run with its steps (delivery order) and log (oldest first). */
export const loadSystemBuildRunDetail = async (client: CanonicalDataClient, run: SystemBuildRun): Promise<SystemBuildRunDetail> => {
  const [steps, events] = await Promise.all([
    listSystemBuildRunStepsByRunId(client, run.id),
    listSystemBuildRunEventsByRunId(client, run.id),
  ]);
  return { run, steps, events };
};
