import { createConvention } from '../../data/conventions';
import type { Convention, CreateConventionInput } from '../../model/convention';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Creates a convention for POST /api/data/conventions.
 */
export const processCreateConvention = async (
  client: CanonicalDataClient,
  input: CreateConventionInput
): Promise<Convention> => createConvention(client, input);
