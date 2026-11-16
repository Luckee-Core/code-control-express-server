import type { ConventionSnapshotUse, CreateConventionSnapshotUseInput } from '../../model/convention-snapshot-use';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Records that a caller used a convention snapshot. (Storage Express `createConventionSnapshotUse`)
 */
export const createConventionSnapshotUse = async (
  client: CanonicalDataClient,
  input: CreateConventionSnapshotUseInput
): Promise<ConventionSnapshotUse> => invokeCanonicalDataOperation<ConventionSnapshotUse>(client, 'createConventionSnapshotUse', [input]);
