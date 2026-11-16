import type { ConventionSnapshot } from '../../model/convention-snapshot';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Returns one convention snapshot by id, or null. (Storage Express `getConventionSnapshotById`)
 */
export const getConventionSnapshotById = async (
  client: CanonicalDataClient,
  id: string
): Promise<ConventionSnapshot | null> => invokeCanonicalDataOperation<ConventionSnapshot | null>(client, 'getConventionSnapshotById', [id]);
