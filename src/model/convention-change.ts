export type ConventionChangeType =
  | 'create'
  | 'refine'
  | 'deprecate'
  | 'activate'
  | 'status_change'
  | 'severity_change'
  | 'check_change'
  | 'reorder'
  | 'delete'
  | 'role_change'
  | 'example_add'
  | 'example_update'
  | 'example_remove';

export type ConventionChangeSourceType =
  | 'manual'
  | 'migration'
  | 'delivery_revision'
  | 'template_change'
  | 'reviewer'
  | 'convention_agent'
  | 'template_agent';

export type ConventionChangeStatus = 'proposed' | 'applied' | 'rejected' | 'superseded';

/** How an AI-proposed change compares with the existing catalog. */
export type ConventionChangeVerdict = 'new' | 'refines' | 'conflicts' | 'duplicate' | 'wrong_scope';

/** Row in convention_changes (the convention change ledger). */
export type ConventionChange = {
  id: string;
  /** Null for a proposed create; no FK, so it survives a deleted convention. */
  convention_id: string | null;
  convention_key: string;
  domain_key: string;
  /** Repo roles linked to the convention at the time of the change. */
  role_keys: string[];
  change_type: ConventionChangeType;
  changed_fields: string[];
  /** Full row before the change (convention, example, or { role_keys }); null for creates. */
  before: Record<string, unknown> | null;
  /** Full row after the change; null for deletes. */
  after: Record<string, unknown> | null;
  reason: string;
  source_type: ConventionChangeSourceType;
  source_id: string | null;
  status: ConventionChangeStatus;
  verdict: ConventionChangeVerdict | null;
  cited_key: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Who made a change and why. Optional trailing argument on every convention writer;
 * defaults to a manual change with no reason.
 */
export type ConventionChangeContext = {
  source_type?: ConventionChangeSourceType;
  source_id?: string | null;
  reason?: string;
  /**
   * Finalize this proposed ledger row (status proposed → applied) instead of inserting a new one.
   * The write fails when the row is no longer proposed, so a proposal can't be applied twice.
   */
  proposed_change_id?: string;
};

/** One AI-proposed change, recorded as a `proposed` ledger row before anyone applies it. */
export type ProposedConventionChangeInput = {
  convention_id: string | null;
  convention_key: string;
  domain_key: string;
  role_keys: string[];
  change_type: ConventionChangeType;
  /** Current state of what would change (null for a create). */
  before: Record<string, unknown> | null;
  /** Desired state / fields to write. */
  after: Record<string, unknown> | null;
  reason: string;
  verdict: ConventionChangeVerdict | null;
  cited_key: string | null;
  source_type: ConventionChangeSourceType;
  source_id: string;
};

/** Edits a reviewer makes to a proposed row before applying it. */
export type UpdateProposedConventionChangeInput = {
  after?: Record<string, unknown> | null;
  reason?: string;
  change_type?: ConventionChangeType;
};

/** Optional filters for listConventionChanges. */
export type ListConventionChangesFilter = {
  convention_id?: string;
  convention_key?: string;
  domain_key?: string;
  role_key?: string;
  change_type?: ConventionChangeType;
  source_type?: ConventionChangeSourceType;
  source_id?: string;
  ids?: string[];
  status?: ConventionChangeStatus;
  /** ISO timestamp; created_at >= since. */
  since?: string;
  /** Default 200, max 1000. */
  limit?: number;
};
