import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';
import type { Customer } from '../../model/customer';

export const listLegacyLocalCustomers = async (client: CanonicalDataClient): Promise<Customer[]> =>
  invokeCanonicalDataOperation<Customer[]>(client, 'listLegacyLocalCustomers', []);
