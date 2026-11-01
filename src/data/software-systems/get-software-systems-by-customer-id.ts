import type { SoftwareSystem } from '../../model/software-system';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads projects for a customer (oldest first) from Storage Express.
 */
export const getSoftwareSystemsByCustomerId = async (
  client: CanonicalDataClient,
  customerId: string
): Promise<SoftwareSystem[]> =>
  invokeCanonicalDataOperation<SoftwareSystem[]>(client, 'getSoftwareSystemsByCustomerId', [customerId]);
