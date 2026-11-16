import { listConventions } from '../../data/conventions';
import type { Convention, ListConventionsFilter } from '../../model/convention';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists conventions for GET /api/data/conventions.
 */
export const processListConventions = async (
  client: CanonicalDataClient,
  filter: ListConventionsFilter
): Promise<Convention[]> => listConventions(client, filter);
