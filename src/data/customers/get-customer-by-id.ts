import type { Customer } from '../../model/customer';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Loads one customer by primary key from Storage Express.
 */
export const getCustomerById = async (
  storage: StorageClient,
  id: string
): Promise<Customer | null> =>
  invokeStorageOperation<Customer | null>(storage, 'getCustomerById', [id]);
