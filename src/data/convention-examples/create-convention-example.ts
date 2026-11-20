import type { ConventionChangeContext } from '../../model/convention-change';
import type { ConventionExample, CreateConventionExampleInput } from '../../model/convention-example';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a convention example. Writes a convention_changes ledger row in the same storage transaction. (Storage Express invoke)
 */
export const createConventionExample = async (
  client: CanonicalDataClient,
  input: CreateConventionExampleInput,
  change?: ConventionChangeContext,
): Promise<ConventionExample> =>
  invokeCanonicalDataOperation<ConventionExample>(client, 'createConventionExample', [input, change ?? {}]);
