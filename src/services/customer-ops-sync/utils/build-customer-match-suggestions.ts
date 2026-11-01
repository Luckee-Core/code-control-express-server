import { normalizeCustomerName } from './normalize-customer-name';
import type {
  CustomerMatchKind,
  CustomerOpsSyncSuggestion,
  LocalLegacyCustomer,
  OpsCustomer,
} from '../types';

const fuzzyContains = (a: string, b: string): boolean => {
  return a.includes(b) || b.includes(a);
};

/**
 * Builds suggested Ops matches for each local legacy customer.
 */
export const buildCustomerMatchSuggestions = (
  localCustomers: LocalLegacyCustomer[],
  opsCustomers: OpsCustomer[],
): CustomerOpsSyncSuggestion[] => {
  const opsByNormalized = new Map<string, OpsCustomer[]>();
  for (const ops of opsCustomers) {
    const key = normalizeCustomerName(ops.name);
    const list = opsByNormalized.get(key) ?? [];
    list.push(ops);
    opsByNormalized.set(key, list);
  }

  return localCustomers.map((local) => {
    const normalizedName = normalizeCustomerName(local.name);
    const exactMatches = opsByNormalized.get(normalizedName) ?? [];

    if (exactMatches.length === 1) {
      return {
        localCustomerId: local.id,
        suggestedOpsCustomerId: exactMatches[0].id,
        matchKind: 'exact_name' as CustomerMatchKind,
        normalizedName,
      };
    }

    if (exactMatches.length > 1) {
      return {
        localCustomerId: local.id,
        suggestedOpsCustomerId: exactMatches[0].id,
        matchKind: 'fuzzy_name' as CustomerMatchKind,
        normalizedName,
      };
    }

    const fuzzy = opsCustomers.find((ops) => {
      const opsNorm = normalizeCustomerName(ops.name);
      return fuzzyContains(normalizedName, opsNorm);
    });

    if (fuzzy) {
      return {
        localCustomerId: local.id,
        suggestedOpsCustomerId: fuzzy.id,
        matchKind: 'fuzzy_name' as CustomerMatchKind,
        normalizedName,
      };
    }

    return {
      localCustomerId: local.id,
      suggestedOpsCustomerId: null,
      matchKind: 'none' as CustomerMatchKind,
      normalizedName,
    };
  });
};

export const countOpsOnlyCustomers = (
  opsCustomers: OpsCustomer[],
  suggestions: CustomerOpsSyncSuggestion[],
): number => {
  const matchedOpsIds = new Set(
    suggestions.map((s) => s.suggestedOpsCustomerId).filter((id): id is string => Boolean(id)),
  );
  return opsCustomers.filter((ops) => !matchedOpsIds.has(ops.id)).length;
};
