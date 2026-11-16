/** Row in convention_snapshots (immutable, deduplicated by content_hash). */
export type ConventionSnapshot = {
  id: string;
  domain_key: string;
  role_key: string;
  content_hash: string;
  text: string;
  convention_keys: string[];
  convention_count: number;
  format_version: number;
  created_at: string;
};

/** Snapshot list row: everything except text, plus how many times it was used. */
export type ConventionSnapshotSummary = Omit<ConventionSnapshot, 'text'> & {
  use_count: number;
};

export type CreateConventionSnapshotInput = {
  domain_key: string;
  role_key: string;
  content_hash: string;
  text: string;
  convention_keys: string[];
  convention_count: number;
  format_version: number;
};

/** Optional filters for listConventionSnapshots. */
export type ListConventionSnapshotsFilter = {
  domain_key?: string;
  role_key?: string;
};
