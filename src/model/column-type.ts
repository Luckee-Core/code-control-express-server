/** Row in column_types (data-model type vocabulary). */
export type ColumnType = {
  key: string;
  name: string;
  sql_type: string;
  ts_type: string;
  when_to_use: string;
  avoid_when: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
