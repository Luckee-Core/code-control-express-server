/** Row in convention_snapshot_uses (which caller used which snapshot). */
export type ConventionSnapshotUse = {
  id: string;
  snapshot_id: string;
  consumer_type: string;
  consumer_id: string;
  software_system_id: string | null;
  created_at: string;
};

export type CreateConventionSnapshotUseInput = {
  snapshot_id: string;
  consumer_type: string;
  consumer_id: string;
  software_system_id?: string | null;
};

/** Optional filters for listConventionSnapshotUses. */
export type ListConventionSnapshotUsesFilter = {
  snapshot_id?: string;
  consumer_type?: string;
  consumer_id?: string;
};
