import { listConventionChanges } from '../../data/convention-changes';
import type { ConventionChange, ListConventionChangesFilter } from '../../model/convention-change';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists convention ledger rows (newest first) for the history views and trend reporting.
 */
export const processListConventionChanges = async (
  client: CanonicalDataClient,
  filter: ListConventionChangesFilter,
): Promise<ConventionChange[]> => listConventionChanges(client, filter);
