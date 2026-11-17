/** Row in table_archetypes (recurring table shapes). */
export type TableArchetype = {
  key: string;
  name: string;
  description: string;
  naming_pattern: string;
  required_columns: unknown[];
  when_to_use: string;
  example_tables: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};
