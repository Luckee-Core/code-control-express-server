import { getSoftwareSystemById } from '../../data/software-systems';
import type { SoftwareSystem } from '../../model/software-system';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Loads one project for GET /api/data/software-systems/:id (null when missing).
 */
export const processGetSoftwareSystem = async (
  client: CanonicalDataClient,
  id: string
): Promise<SoftwareSystem | null> => getSoftwareSystemById(client, id);
