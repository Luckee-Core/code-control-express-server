import type { SoftwareSystem } from '../../model/software-system';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads all customer projects (most recently updated first) from Storage Express.
 */
export const getAllSoftwareSystems = async (client: CanonicalDataClient): Promise<SoftwareSystem[]> =>
  invokeCanonicalDataOperation<SoftwareSystem[]>(client, 'getAllSoftwareSystems');
