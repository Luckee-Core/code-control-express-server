import type { CreateSystemBuildRunInput, SystemBuildRun } from '../../model/system-build-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a build run (status running); fails when the system already has a running or paused run.
 */
export const createSystemBuildRun = async (
  client: CanonicalDataClient,
  input: CreateSystemBuildRunInput,
): Promise<SystemBuildRun> => invokeCanonicalDataOperation<SystemBuildRun>(client, 'createSystemBuildRun', [input]);
