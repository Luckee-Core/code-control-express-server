import type { ConventionChangeContext } from '../../model/convention-change';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Deletes a convention (children cascade). Writes a convention_changes ledger row in the same storage transaction. (Storage Express invoke)
 */
export const deleteConvention = async (
  client: CanonicalDataClient,
  id: string,
  change?: ConventionChangeContext,
): Promise<{ deleted: boolean }> =>
  invokeCanonicalDataOperation<{ deleted: boolean }>(client, 'deleteConvention', [id, change ?? {}]);
