import type { SystemBuildRunStep } from '../../model/system-build-run-step';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists a build run's steps in delivery order.
 */
export const listSystemBuildRunStepsByRunId = async (
  client: CanonicalDataClient,
  runId: string,
): Promise<SystemBuildRunStep[]> => invokeCanonicalDataOperation<SystemBuildRunStep[]>(client, 'listSystemBuildRunStepsByRunId', [runId]);
