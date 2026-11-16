import { getConventionSnapshotById } from '../../data/convention-snapshots';
import type { ConventionSnapshot } from '../../model/convention-snapshot';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Loads one snapshot for GET /api/data/conventions/snapshots/:snapshotId.
 */
export const processGetConventionSnapshot = async (
  client: CanonicalDataClient,
  id: string
): Promise<ConventionSnapshot | null> => getConventionSnapshotById(client, id);
