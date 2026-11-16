import type { ConventionSnapshotUse, ListConventionSnapshotUsesFilter } from '../../model/convention-snapshot-use';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists convention snapshot uses, newest first. (Storage Express `listConventionSnapshotUses`)
 */
export const listConventionSnapshotUses = async (
  client: CanonicalDataClient,
  filter: ListConventionSnapshotUsesFilter = {}
): Promise<ConventionSnapshotUse[]> => invokeCanonicalDataOperation<ConventionSnapshotUse[]>(client, 'listConventionSnapshotUses', [filter]);
