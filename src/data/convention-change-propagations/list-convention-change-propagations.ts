import type { ConventionChangePropagation, ListConventionChangePropagationsFilter } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Propagation rows by change ids, run, template repo or status. (Storage Express invoke)
 */
export const listConventionChangePropagations = async (
  client: CanonicalDataClient,
  filter: ListConventionChangePropagationsFilter = {},
): Promise<ConventionChangePropagation[]> =>
  invokeCanonicalDataOperation<ConventionChangePropagation[]>(client, 'listConventionChangePropagations', [filter]);
