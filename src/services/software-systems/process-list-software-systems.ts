import { getAllSoftwareSystems } from '../../data/software-systems';
import type { SoftwareSystem } from '../../model/software-system';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists all software systems for GET /api/data/software-systems.
 */
export const processListSoftwareSystems = async (
  client: CanonicalDataClient,
): Promise<SoftwareSystem[]> => getAllSoftwareSystems(client);
