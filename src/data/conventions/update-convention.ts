import type { Convention, UpdateConventionInput } from '../../model/convention';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a convention. (Storage Express invoke)
 */
export const updateConvention = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionInput,
): Promise<Convention> =>
  invokeCanonicalDataOperation<Convention>(client, 'updateConvention', [id, input]);
