import type { Convention, CreateConventionInput } from '../../model/convention';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a convention. (Storage Express `createConvention`)
 */
export const createConvention = async (
  client: CanonicalDataClient,
  input: CreateConventionInput
): Promise<Convention> => invokeCanonicalDataOperation<Convention>(client, 'createConvention', [input]);
