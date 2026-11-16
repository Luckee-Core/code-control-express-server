export type StandardColumnSetBy = 'db_default' | 'crud';

/** Row in standard_columns (columns every table gets). */
export type StandardColumn = {
  name: string;
  sql_definition: string;
  ts_type: string;
  set_by: StandardColumnSetBy;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
