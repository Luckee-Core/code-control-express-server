import { listConventionSnapshots } from '../../data/convention-snapshots';
import type { ConventionSnapshotSummary, ListConventionSnapshotsFilter } from '../../model/convention-snapshot';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists snapshots for GET /api/data/conventions/snapshots.
 */
export const processListConventionSnapshots = async (
  client: CanonicalDataClient,
  filter: ListConventionSnapshotsFilter
): Promise<ConventionSnapshotSummary[]> => listConventionSnapshots(client, filter);
