export type ConventionSeverity = 'must' | 'should' | 'avoid' | 'never';

export type ConventionStatus = 'draft' | 'active' | 'deprecated';

export type ConventionCheckKind = 'none' | 'proposal' | 'sql' | 'file_path';

/** Row in conventions. */
export type Convention = {
  id: string;
  key: string;
  domain_key: string;
  topic_key: string;
  title: string;
  statement: string;
  rationale: string;
  severity: ConventionSeverity;
  status: ConventionStatus;
  check_kind: ConventionCheckKind;
  check_config: Record<string, unknown> | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CreateConventionInput = {
  key: string;
  domain_key: string;
  topic_key: string;
  title: string;
  statement: string;
  rationale?: string;
  severity?: ConventionSeverity;
  status?: ConventionStatus;
  check_kind?: ConventionCheckKind;
  check_config?: Record<string, unknown> | null;
  sort_order?: number;
};

export type UpdateConventionInput = {
  topic_key?: string;
  title?: string;
  statement?: string;
  rationale?: string;
  severity?: ConventionSeverity;
  status?: ConventionStatus;
  check_kind?: ConventionCheckKind;
  check_config?: Record<string, unknown> | null;
  sort_order?: number;
};

/** Optional filters for listConventions. */
export type ListConventionsFilter = {
  domain_key?: string;
  topic_key?: string;
  status?: ConventionStatus;
  severity?: ConventionSeverity;
  role_key?: string;
};
