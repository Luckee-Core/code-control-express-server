import type { Convention, ListConventionsFilter } from '../../model/convention';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists conventions with optional filters. (Storage Express invoke)
 */
export const listConventions = async (
  client: CanonicalDataClient,
  filter: ListConventionsFilter = {},
): Promise<Convention[]> =>
  invokeCanonicalDataOperation<Convention[]>(client, 'listConventions', [filter]);
