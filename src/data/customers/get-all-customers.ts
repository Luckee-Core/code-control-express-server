import type { Customer, GetAllCustomersParams } from '../../model/customer';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Loads customers (newest first), optionally filtered by stage, from Storage Express.
 */
export const getAllCustomers = async (
  storage: StorageClient,
  params?: GetAllCustomersParams
): Promise<Customer[]> => invokeStorageOperation<Customer[]>(storage, 'getAllCustomers', [params]);
