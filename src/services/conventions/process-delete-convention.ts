import { deleteConvention } from '../../data/conventions';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Deletes a convention for DELETE /api/data/conventions/:id.
 */
export const processDeleteConvention = async (
  client: CanonicalDataClient,
  id: string
): Promise<{ deleted: boolean }> => deleteConvention(client, id);
