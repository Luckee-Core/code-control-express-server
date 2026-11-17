import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Deletes a convention source. (Storage Express invoke)
 */
export const deleteConventionSource = async (
  client: CanonicalDataClient,
  id: string,
): Promise<{ deleted: boolean }> =>
  invokeCanonicalDataOperation<{ deleted: boolean }>(client, 'deleteConventionSource', [id]);
