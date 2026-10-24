import type { CreateCustomerInput, Customer } from '../../model/customer';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Inserts a customer row via Storage Express.
 */
export const createCustomer = async (
  client: CanonicalDataClient,
  input: CreateCustomerInput
): Promise<Customer> => invokeCanonicalDataOperation<Customer>(client, 'createCustomer', [input]);
