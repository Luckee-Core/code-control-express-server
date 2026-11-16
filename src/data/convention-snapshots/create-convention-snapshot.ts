import type { ConventionSnapshot, CreateConventionSnapshotInput } from '../../model/convention-snapshot';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Saves a convention snapshot, or returns the existing one with the same content hash. (Storage Express `createConventionSnapshot`)
 */
export const createConventionSnapshot = async (
  client: CanonicalDataClient,
  input: CreateConventionSnapshotInput
): Promise<ConventionSnapshot> => invokeCanonicalDataOperation<ConventionSnapshot>(client, 'createConventionSnapshot', [input]);
