import type { SystemBuildRun } from '../../model/system-build-run';
import type { SystemBuildRunEvent } from '../../model/system-build-run-event';
import type { SystemBuildRunStep } from '../../model/system-build-run-step';

/** GET /api/data/system-build-runs/:id: the run with its steps and log. */
export type SystemBuildRunDetail = {
  run: SystemBuildRun;
  steps: SystemBuildRunStep[];
  events: SystemBuildRunEvent[];
};
