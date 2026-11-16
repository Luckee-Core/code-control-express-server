import type { ConventionSnapshotSummary, ListConventionSnapshotsFilter } from '../../model/convention-snapshot';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists convention snapshots (without text), newest first. (Storage Express `listConventionSnapshots`)
 */
export const listConventionSnapshots = async (
  client: CanonicalDataClient,
  filter: ListConventionSnapshotsFilter = {}
): Promise<ConventionSnapshotSummary[]> => invokeCanonicalDataOperation<ConventionSnapshotSummary[]>(client, 'listConventionSnapshots', [filter]);
