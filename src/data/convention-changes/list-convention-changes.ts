import type { ConventionChange, ListConventionChangesFilter } from '../../model/convention-change';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists convention ledger rows, newest first. (Storage Express invoke)
 */
export const listConventionChanges = async (
  client: CanonicalDataClient,
  filter: ListConventionChangesFilter = {},
): Promise<ConventionChange[]> =>
  invokeCanonicalDataOperation<ConventionChange[]>(client, 'listConventionChanges', [filter]);
