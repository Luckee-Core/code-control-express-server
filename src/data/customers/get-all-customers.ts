import type { Customer, GetAllCustomersParams } from '../../model/customer';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads customers (newest first), optionally filtered by stage, from Storage Express.
 */
export const getAllCustomers = async (
  client: CanonicalDataClient,
  params?: GetAllCustomersParams
): Promise<Customer[]> => invokeCanonicalDataOperation<Customer[]>(client, 'getAllCustomers', [params]);
