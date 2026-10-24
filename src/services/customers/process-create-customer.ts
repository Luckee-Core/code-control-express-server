import { createCustomer } from '../../data/customers';
import type { CreateCustomerInput, Customer } from '../../model/customer';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Creates a customer for POST /api/data/customers.
 */
export const processCreateCustomer = async (
  client: CanonicalDataClient,
  input: CreateCustomerInput
): Promise<Customer> => createCustomer(client, input);
