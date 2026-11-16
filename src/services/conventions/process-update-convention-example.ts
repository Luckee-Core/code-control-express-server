import { updateConventionExample } from '../../data/convention-examples';
import type { ConventionExample, UpdateConventionExampleInput } from '../../model/convention-example';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Updates an example for PATCH /api/data/conventions/examples/:exampleId.
 */
export const processUpdateConventionExample = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionExampleInput
): Promise<ConventionExample> => updateConventionExample(client, id, input);
