import { listLegacyLocalCustomers } from '../../data/studio-migration';
import type { CanonicalDataClient } from '../canonical-data-client/types';
import { requestOpsTracker } from '../ops-tracker-client';
import {
  buildCustomerMatchSuggestions,
  countOpsOnlyCustomers,
} from './utils/build-customer-match-suggestions';
import type { CustomerOpsSyncComparePayload, LocalLegacyCustomer, OpsCustomer } from './types';

/**
 * Loads local legacy customers and Ops CRM customers with match suggestions.
 */
export const processCompareCustomerOpsSync = async (
  client: CanonicalDataClient,
): Promise<CustomerOpsSyncComparePayload> => {
  const localRows = await listLegacyLocalCustomers(client);
  const localCustomers: LocalLegacyCustomer[] = localRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    stage: (row.stage ?? 'discovery_call') as LocalLegacyCustomer['stage'],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
  const opsResult = await requestOpsTracker<OpsCustomer[]>('/customers');
  if (!opsResult.success) {
    throw new Error(opsResult.error);
  }
  const opsCustomers = opsResult.data ?? [];
  const suggestions = buildCustomerMatchSuggestions(localCustomers, opsCustomers);
  const unmatchedLocalCount = suggestions.filter((s) => s.matchKind === 'none').length;

  return {
    localCustomers,
    opsCustomers,
    suggestions,
    summary: {
      localCount: localCustomers.length,
      opsCount: opsCustomers.length,
      unmatchedLocalCount,
      opsOnlyCount: countOpsOnlyCustomers(opsCustomers, suggestions),
    },
  };
};
