import { getAllCustomers } from '../../data/customers';
import type { Customer } from '../../model/customer';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists customers for GET /api/data/customers, optionally filtered by stage.
 */
export const processListCustomers = async (
  client: CanonicalDataClient,
  stage?: string
): Promise<Customer[]> => getAllCustomers(client, stage ? { stage } : undefined);
