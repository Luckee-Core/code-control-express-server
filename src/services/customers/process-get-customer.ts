import { getCustomerById } from '../../data/customers';
import type { Customer } from '../../model/customer';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Loads one customer for GET /api/data/customers/:id (null when missing).
 */
export const processGetCustomer = async (
  client: CanonicalDataClient,
  id: string
): Promise<Customer | null> => getCustomerById(client, id);
