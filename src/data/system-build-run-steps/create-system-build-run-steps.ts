import type { CreateSystemBuildRunStepInput, SystemBuildRunStep } from '../../model/system-build-run-step';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a build run's step rows; returns them by position.
 */
export const createSystemBuildRunSteps = async (
  client: CanonicalDataClient,
  inputs: CreateSystemBuildRunStepInput[],
): Promise<SystemBuildRunStep[]> => invokeCanonicalDataOperation<SystemBuildRunStep[]>(client, 'createSystemBuildRunSteps', [inputs]);
