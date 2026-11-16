import { createConventionExample } from '../../data/convention-examples';
import type { ConventionExample, CreateConventionExampleInput } from '../../model/convention-example';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Creates an example for POST /api/data/conventions/:id/examples.
 */
export const processCreateConventionExample = async (
  client: CanonicalDataClient,
  input: CreateConventionExampleInput
): Promise<ConventionExample> => createConventionExample(client, input);
