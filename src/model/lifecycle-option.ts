/** Row in lifecycle_options (per-table delete/archive strategy). */
export type LifecycleOption = {
  key: string;
  name: string;
  columns_sql: string;
  read_filter: string;
  when_to_use: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
