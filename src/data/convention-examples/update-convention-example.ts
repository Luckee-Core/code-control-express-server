import type { ConventionChangeContext } from '../../model/convention-change';
import type { ConventionExample, UpdateConventionExampleInput } from '../../model/convention-example';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a convention example. Writes a convention_changes ledger row in the same storage transaction. (Storage Express invoke)
 */
export const updateConventionExample = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionExampleInput,
  change?: ConventionChangeContext,
): Promise<ConventionExample> =>
  invokeCanonicalDataOperation<ConventionExample>(client, 'updateConventionExample', [id, input, change ?? {}]);
