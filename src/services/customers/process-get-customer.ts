import { getCustomerById } from '../../data/customers';
import type { Customer } from '../../model/customer';
import type { StorageClient } from '../storage-client';

/**
 * Loads one customer for GET /api/data/customers/:id (null when missing).
 */
export const processGetCustomer = async (
  storage: StorageClient,
  id: string
): Promise<Customer | null> => getCustomerById(storage, id);
