import type { CrudTable } from './crud-operations';
import type { RenderColumn } from './types';

/** How a list page treats one column: drives table cells, search and filter controls. */
export type ListColumnKind = 'text' | 'enum' | 'boolean' | 'number' | 'date' | 'timestamp' | 'reference' | 'json' | 'array';

export type ListColumn = {
  /** Field name on the model (snake_case, as in the row type). */
  name: string;
  /** Header / filter label: due_date → Due date. */
  label: string;
  kind: ListColumnKind;
  /** Allowed values (enum only). */
  enum_values: string[];
  /** Model union type for an enum column (BusinessFactStatus), '' otherwise. */
  enum_type: string;
  /** Filter input folder (kebab): due_date → due-date. */
  input_folder: string;
  /** PascalCase field: due_date → DueDate (filter actions, component names). */
  field_pascal: string;
  /** camelCase field: due_date → dueDate (filter slice keys). */
  field_camel: string;
  nullable: boolean;
  /** Parent table for a foreign key ('' otherwise). */
  references_table: string;
  /** Long text (description, notes, body…): a textarea in forms. */
  multiline: boolean;
};

/** What a generated list page shows and filters on, derived from the table's columns. */
export type TableListView = {
  /** Pure link table (2+ foreign keys, nothing else to browse): gets no list page. */
  is_join: boolean;
  /** Table columns in order: up to 5 readable business columns, then updated_at. */
  columns: ListColumn[];
  /** Text columns the search box matches (id when there are none). */
  search_columns: string[];
  /** One dropdown per enum column. */
  enum_filters: ListColumn[];
  /** One Yes / No select per boolean column. */
  boolean_filters: ListColumn[];
  /** Emphasized first cell (first text column, '' when none). */
  primary_column: string;
};

const MAX_BUSINESS_COLUMNS = 5;
const LIFECYCLE_HIDDEN = new Set(['deleted_at']);
const JOIN_EXTRA_COLUMNS = new Set(['sort_order']);

const humanize = (name: string): string => {
  const text = name.replace(/_/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const pascal = (name: string): string =>
  name
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

const kindOf = (column: RenderColumn): ListColumnKind => {
  if (column.enum_values.length > 0) return 'enum';
  if (column.references_table) return 'reference';
  const sql = column.sql_type.toUpperCase();
  if (sql.endsWith('[]')) return 'array';
  if (sql === 'JSONB' || sql === 'JSON') return 'json';
  if (sql === 'BOOLEAN') return 'boolean';
  if (sql === 'UUID') return 'reference';
  if (sql === 'DATE') return 'date';
  if (sql.startsWith('TIMESTAMP')) return 'timestamp';
  if (column.ts_type === 'number') return 'number';
  return 'text';
};

const MULTILINE = /(^|_)(description|notes?|body|content|summary|details|text|message|bio|instructions)$/;

export const toListColumn = (column: RenderColumn, entity: string): ListColumn => {
  const field = pascal(column.name);
  const kind = kindOf(column);
  return {
    name: column.name,
    // A foreign key reads as the thing it points at: business_fact_id → Business fact.
    label: kind === 'reference' && /_id$/.test(column.name) ? humanize(column.name.replace(/_id$/, '')) : humanize(column.name),
    kind,
    enum_values: kind === 'enum' ? column.enum_values : [],
    enum_type: kind === 'enum' ? `${entity}${field}` : '',
    input_folder: column.name.replace(/_/g, '-'),
    field_pascal: field,
    field_camel: field.charAt(0).toLowerCase() + field.slice(1),
    nullable: !column.not_null,
    references_table: column.references_table,
    multiline: kind === 'text' && MULTILINE.test(column.name),
  };
};

const UPDATED_AT: ListColumn = {
  name: 'updated_at',
  label: 'Updated',
  kind: 'timestamp',
  enum_values: [],
  enum_type: '',
  input_folder: 'updated-at',
  field_pascal: 'UpdatedAt',
  field_camel: 'updatedAt',
  nullable: false,
  references_table: '',
  multiline: false,
};

/** List page view for one table: displayed columns, search fields and filter controls. */
export const buildTableListView = (crud: CrudTable): TableListView => {
  const all = crud.columns.map((column) => toListColumn(column, crud.names.Entity));
  // Join detection looks at the table's own columns only (lifecycle columns like is_active don't count).
  const own = new Set(crud.table.columns.map((column) => column.name));
  const ownColumns = all.filter((column) => own.has(column.name));
  const references = ownColumns.filter((column) => column.kind === 'reference').length;
  const isJoin = references >= 2 && ownColumns.every((column) => column.kind === 'reference' || JOIN_EXTRA_COLUMNS.has(column.name));
  const readable = all.filter(
    (column) => !LIFECYCLE_HIDDEN.has(column.name) && column.kind !== 'json' && column.kind !== 'array' && column.kind !== 'reference',
  );
  const columns = [...readable.slice(0, MAX_BUSINESS_COLUMNS), UPDATED_AT];
  const text = all.filter((column) => column.kind === 'text');
  return {
    is_join: isJoin,
    columns,
    search_columns: text.length > 0 ? text.map((column) => column.name) : ['id'],
    enum_filters: all.filter((column) => column.kind === 'enum'),
    boolean_filters: all.filter((column) => column.kind === 'boolean'),
    primary_column: columns.find((column) => column.kind === 'text')?.name ?? '',
  };
};
