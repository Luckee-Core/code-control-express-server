import type { ConventionChangePropagation, InsertConventionChangePropagationInput } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Inserts propagation rows (existing change × repo pairs are left as is); returns the inserted rows. (Storage Express invoke)
 */
export const insertConventionChangePropagations = async (
  client: CanonicalDataClient,
  rows: InsertConventionChangePropagationInput[],
): Promise<ConventionChangePropagation[]> =>
  invokeCanonicalDataOperation<ConventionChangePropagation[]>(client, 'insertConventionChangePropagations', [rows]);
