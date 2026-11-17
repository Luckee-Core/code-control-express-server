import type { ConventionExample, CreateConventionExampleInput } from '../../model/convention-example';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a convention example. (Storage Express invoke)
 */
export const createConventionExample = async (
  client: CanonicalDataClient,
  input: CreateConventionExampleInput,
): Promise<ConventionExample> =>
  invokeCanonicalDataOperation<ConventionExample>(client, 'createConventionExample', [input]);
