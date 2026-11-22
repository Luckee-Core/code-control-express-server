import type { ColumnType } from '../../model/column-type';
import type { LifecycleOption } from '../../model/lifecycle-option';
import type { StandardColumn } from '../../model/standard-column';

/**
 * Repo role a rendered file belongs to (repo_roles.key). dispatcher, dispatcher-web and gateway only
 * receive the `dispatcher` kind (gateway = the shared main gateway repo).
 */
export type CodegenRole = 'storage' | 'express' | 'web' | 'dispatcher' | 'dispatcher-web' | 'gateway';

/** One file Code Control writes into a repo. */
export type RenderedFile = {
  role: CodegenRole;
  path: string;
  content: string;
  /** create = new file; update = merged into a file that already exists on the default branch. */
  action: 'create' | 'update';
};

/** A convention check result for a rendered file. */
export type RenderFinding = {
  severity: 'error' | 'warning';
  role: CodegenRole;
  path: string;
  message: string;
  convention_key: string;
};

/** Vocabulary rows the renderers read (from the approved proposal's conventions snapshot). */
export type CodegenVocabulary = {
  column_types: ColumnType[];
  standard_columns: StandardColumn[];
  lifecycle_options: LifecycleOption[];
};

/** A column ready to render: proposal column or lifecycle column, with SQL and TS resolved. */
export type RenderColumn = {
  name: string;
  /** Base SQL type without constraints, e.g. TEXT, INTEGER, TEXT[]. */
  sql_type: string;
  not_null: boolean;
  /** SQL default expression, '' when none. */
  default_sql: string;
  /** Allowed values for an enum column (rendered as CHECK + TS union); [] otherwise. */
  enum_values: string[];
  references_table: string;
  on_delete: 'none' | 'cascade' | 'set_null' | 'restrict';
  is_unique: boolean;
  is_indexed: boolean;
  /** TS type for non-enum columns (enum columns use their union alias). */
  ts_type: string;
  description: string;
};

/** What already exists in a target repo's default branch, read before rendering. */
export type RepoRenderState = {
  /** File names in migrations/ (storage only). */
  migration_file_names: string[];
  /** Current src/model/index.ts, null when missing. */
  model_barrel: string | null;
  /** Current src/services/storage/seed-table-names.ts, null when missing (storage only). */
  seed_table_names: string | null;
};
