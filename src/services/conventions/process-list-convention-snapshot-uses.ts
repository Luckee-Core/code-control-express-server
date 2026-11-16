import { listConventionSnapshotUses } from '../../data/convention-snapshot-uses';
import type { ConventionSnapshotUse } from '../../model/convention-snapshot-use';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists uses for GET /api/data/conventions/snapshots/:snapshotId/uses.
 */
export const processListConventionSnapshotUses = async (
  client: CanonicalDataClient,
  snapshotId: string
): Promise<ConventionSnapshotUse[]> => listConventionSnapshotUses(client, { snapshot_id: snapshotId });
