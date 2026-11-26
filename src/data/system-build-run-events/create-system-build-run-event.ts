import type { CreateSystemBuildRunEventInput, SystemBuildRunEvent } from '../../model/system-build-run-event';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Appends one entry to a build run's log.
 */
export const createSystemBuildRunEvent = async (
  client: CanonicalDataClient,
  input: CreateSystemBuildRunEventInput,
): Promise<SystemBuildRunEvent> => invokeCanonicalDataOperation<SystemBuildRunEvent>(client, 'createSystemBuildRunEvent', [input]);
