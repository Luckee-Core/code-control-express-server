import type { SystemBuildRunStep, UpdateSystemBuildRunStepInput } from '../../model/system-build-run-step';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a build run step; null when not found.
 */
export const updateSystemBuildRunStep = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateSystemBuildRunStepInput,
): Promise<SystemBuildRunStep | null> => invokeCanonicalDataOperation<SystemBuildRunStep | null>(client, 'updateSystemBuildRunStep', [id, input]);
