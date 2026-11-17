import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Deletes a convention example. (Storage Express invoke)
 */
export const deleteConventionExample = async (
  client: CanonicalDataClient,
  id: string,
): Promise<{ deleted: boolean }> =>
  invokeCanonicalDataOperation<{ deleted: boolean }>(client, 'deleteConventionExample', [id]);
