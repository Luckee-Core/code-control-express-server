import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Deletes a convention (roles, examples and sources cascade). (Storage Express `deleteConvention`)
 */
export const deleteConvention = async (
  client: CanonicalDataClient,
  id: string
): Promise<{ deleted: boolean }> => invokeCanonicalDataOperation<{ deleted: boolean }>(client, 'deleteConvention', [id]);
