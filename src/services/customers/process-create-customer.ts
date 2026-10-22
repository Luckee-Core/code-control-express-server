import { createCustomer } from '../../data/customers';
import type { CreateCustomerInput, Customer } from '../../model/customer';
import type { StorageClient } from '../storage-client';

/**
 * Creates a customer for POST /api/data/customers.
 */
export const processCreateCustomer = async (
  storage: StorageClient,
  input: CreateCustomerInput
): Promise<Customer> => createCustomer(storage, input);
