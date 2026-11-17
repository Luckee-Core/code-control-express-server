import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Deletes a convention (children cascade). (Storage Express invoke)
 */
export const deleteConvention = async (
  client: CanonicalDataClient,
  id: string,
): Promise<{ deleted: boolean }> =>
  invokeCanonicalDataOperation<{ deleted: boolean }>(client, 'deleteConvention', [id]);
