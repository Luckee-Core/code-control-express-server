import type { ConventionChangeContext } from '../../model/convention-change';
import type { Convention, UpdateConventionInput } from '../../model/convention';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a convention. Writes a convention_changes ledger row in the same storage transaction. (Storage Express invoke)
 */
export const updateConvention = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionInput,
  change?: ConventionChangeContext,
): Promise<Convention> =>
  invokeCanonicalDataOperation<Convention>(client, 'updateConvention', [id, input, change ?? {}]);
