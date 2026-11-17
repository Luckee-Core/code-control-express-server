import type { ConventionExample, UpdateConventionExampleInput } from '../../model/convention-example';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a convention example. (Storage Express invoke)
 */
export const updateConventionExample = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionExampleInput,
): Promise<ConventionExample> =>
  invokeCanonicalDataOperation<ConventionExample>(client, 'updateConventionExample', [id, input]);
