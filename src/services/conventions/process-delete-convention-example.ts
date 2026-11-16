import { deleteConventionExample } from '../../data/convention-examples';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Deletes an example for DELETE /api/data/conventions/examples/:exampleId.
 */
export const processDeleteConventionExample = async (
  client: CanonicalDataClient,
  id: string
): Promise<{ deleted: boolean }> => deleteConventionExample(client, id);
