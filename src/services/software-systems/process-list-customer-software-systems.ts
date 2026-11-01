import { getSoftwareSystemsByCustomerId } from '../../data/software-systems';
import type { SoftwareSystem } from '../../model/software-system';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists one customer's projects for GET /api/data/software-systems/customer/:customerId.
 */
export const processListCustomerSoftwareSystems = async (
  client: CanonicalDataClient,
  customerId: string
): Promise<SoftwareSystem[]> => getSoftwareSystemsByCustomerId(client, customerId);
