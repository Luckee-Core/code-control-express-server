import type { ConventionChangePropagation, UpdateConventionChangePropagationsInput } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Bulk-updates propagation rows selected by ids and/or run; returns the changed rows. (Storage Express invoke)
 */
export const updateConventionChangePropagations = async (
  client: CanonicalDataClient,
  input: UpdateConventionChangePropagationsInput,
): Promise<ConventionChangePropagation[]> =>
  invokeCanonicalDataOperation<ConventionChangePropagation[]>(client, 'updateConventionChangePropagations', [input]);
