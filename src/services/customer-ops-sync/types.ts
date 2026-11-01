import type { CustomerStage } from '../../model/customer';

export type OpsCustomerStatus = 'pending_review' | 'active' | 'inactive';

export type OpsCustomer = {
  id: string;
  user_id: string | null;
  name: string;
  status: OpsCustomerStatus;
  company: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  facebook_url: string | null;
  created_at: string;
  updated_at: string;
};

export type LocalLegacyCustomer = {
  id: string;
  name: string;
  description: string | null;
  stage: CustomerStage;
  created_at: string;
  updated_at: string;
};

export type CustomerMatchKind = 'exact_name' | 'fuzzy_name' | 'none';

export type CustomerOpsSyncSuggestion = {
  localCustomerId: string;
  suggestedOpsCustomerId: string | null;
  matchKind: CustomerMatchKind;
  normalizedName: string;
};

export type CustomerOpsSyncComparePayload = {
  localCustomers: LocalLegacyCustomer[];
  opsCustomers: OpsCustomer[];
  suggestions: CustomerOpsSyncSuggestion[];
  summary: {
    localCount: number;
    opsCount: number;
    unmatchedLocalCount: number;
    opsOnlyCount: number;
  };
};

export type CustomerOpsSyncDecision = {
  localCustomerId: string;
  action: 'link' | 'create';
  opsCustomerId?: string;
};

export type CustomerOpsSyncApplyRequest = {
  decisions: CustomerOpsSyncDecision[];
};

export type CustomerOpsSyncApplyRowResult = {
  localCustomerId: string;
  action: 'link' | 'create';
  opsCustomerId: string | null;
  projectsUpdated: number;
  reposUpdated: number;
  status: 'ok' | 'skipped' | 'error';
  error?: string;
};

export type CustomerOpsSyncApplyPayload = {
  results: CustomerOpsSyncApplyRowResult[];
  summary: {
    ok: number;
    failed: number;
    skipped: number;
    totalProjectsUpdated: number;
    totalReposUpdated: number;
  };
};
