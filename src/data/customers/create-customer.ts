import type { CreateCustomerInput, Customer } from '../../model/customer';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Inserts a customer row via Storage Express.
 */
export const createCustomer = async (
  storage: StorageClient,
  input: CreateCustomerInput
): Promise<Customer> => invokeStorageOperation<Customer>(storage, 'createCustomer', [input]);
