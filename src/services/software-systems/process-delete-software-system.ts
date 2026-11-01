import { deleteSoftwareSystem } from '../../data/software-systems';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Deletes a project for DELETE /api/data/software-systems/:id.
 */
export const processDeleteSoftwareSystem = async (client: CanonicalDataClient, id: string): Promise<void> =>
  deleteSoftwareSystem(client, id);
