import type { Convention, ListConventionsFilter } from '../../model/convention';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists conventions (optionally filtered by domain, topic, status, severity, role). (Storage Express `listConventions`)
 */
export const listConventions = async (
  client: CanonicalDataClient,
  filter: ListConventionsFilter = {}
): Promise<Convention[]> => invokeCanonicalDataOperation<Convention[]>(client, 'listConventions', [filter]);
