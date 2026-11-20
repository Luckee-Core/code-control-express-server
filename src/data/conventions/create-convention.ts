import type { ConventionChangeContext } from '../../model/convention-change';
import type { Convention, CreateConventionInput } from '../../model/convention';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a convention. Writes a convention_changes ledger row in the same storage transaction. (Storage Express invoke)
 */
export const createConvention = async (
  client: CanonicalDataClient,
  input: CreateConventionInput,
  change?: ConventionChangeContext,
): Promise<Convention> =>
  invokeCanonicalDataOperation<Convention>(client, 'createConvention', [input, change ?? {}]);
