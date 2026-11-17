import { deleteConvention } from '../../data/conventions';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Deletes a convention; returns false when it did not exist.
 */
export const processDeleteConvention = async (client: CanonicalDataClient, id: string): Promise<boolean> => {
  const result = await deleteConvention(client, id);
  return result.deleted;
};
