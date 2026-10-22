import { getAllCustomers } from '../../data/customers';
import type { Customer } from '../../model/customer';
import type { StorageClient } from '../storage-client';

/**
 * Lists customers for GET /api/data/customers, optionally filtered by stage.
 */
export const processListCustomers = async (
  storage: StorageClient,
  stage?: string
): Promise<Customer[]> => getAllCustomers(storage, stage ? { stage } : undefined);
