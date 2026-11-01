import type { SoftwareSystem } from '../../model/software-system';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads one project by primary key from Storage Express.
 */
export const getSoftwareSystemById = async (
  client: CanonicalDataClient,
  id: string
): Promise<SoftwareSystem | null> =>
  invokeCanonicalDataOperation<SoftwareSystem | null>(client, 'getSoftwareSystemById', [id]);
