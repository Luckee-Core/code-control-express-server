import { deleteConventionSource } from '../../data/convention-sources';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Deletes a source for DELETE /api/data/conventions/sources/:sourceId.
 */
export const processDeleteConventionSource = async (
  client: CanonicalDataClient,
  id: string
): Promise<{ deleted: boolean }> => deleteConventionSource(client, id);
