import type { ConventionChange } from '../../model/convention-change';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Applied (non-migration) changes with no propagation rows yet. (Storage Express invoke)
 */
export const listUnpropagatedConventionChanges = async (
  client: CanonicalDataClient,
  limit = 500,
): Promise<ConventionChange[]> =>
  invokeCanonicalDataOperation<ConventionChange[]>(client, 'listUnpropagatedConventionChanges', [limit]);
