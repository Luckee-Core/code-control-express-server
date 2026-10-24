import type { Customer } from '../../model/customer';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads one customer by primary key from Storage Express.
 */
export const getCustomerById = async (
  client: CanonicalDataClient,
  id: string
): Promise<Customer | null> =>
  invokeCanonicalDataOperation<Customer | null>(client, 'getCustomerById', [id]);
