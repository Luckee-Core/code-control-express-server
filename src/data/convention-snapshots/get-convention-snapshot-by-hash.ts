import type { ConventionSnapshot } from '../../model/convention-snapshot';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Returns one convention snapshot by content hash, or null. (Storage Express `getConventionSnapshotByHash`)
 */
export const getConventionSnapshotByHash = async (
  client: CanonicalDataClient,
  contentHash: string
): Promise<ConventionSnapshot | null> => invokeCanonicalDataOperation<ConventionSnapshot | null>(client, 'getConventionSnapshotByHash', [contentHash]);
