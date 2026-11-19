import type { ProposedColumn, ProposedTable } from '../../model/data-model-proposal';
import { parseColumnDefinition, parseColumnSql } from './parse-column-sql';
import type { CodegenVocabulary, RenderColumn } from './types';

const TS_FALLBACK = 'string';

/** TS type from column_types.ts_type; descriptive values (e.g. "string literal union") fall back. */
const readTsType = (tsType: string | undefined): string => {
  const value = tsType?.trim() ?? '';
  if (!value || /\b(literal|union)\b/i.test(value)) return TS_FALLBACK;
  return value;
};

const tsTypeForSql = (sqlType: string): string => {
  if (sqlType.endsWith('[]')) return 'string[]';
  if (/^(INTEGER|INT|BIGINT|SMALLINT|REAL|DOUBLE PRECISION)$/.test(sqlType)) return 'number';
  if (sqlType === 'BOOLEAN') return 'boolean';
  if (sqlType === 'JSONB' || sqlType === 'JSON') return 'Record<string, unknown> | unknown[]';
  return TS_FALLBACK;
};

/** A proposal column resolved against the column_types vocabulary. */
const fromProposedColumn = (column: ProposedColumn, vocabulary: CodegenVocabulary): RenderColumn => {
  const type = vocabulary.column_types.find((candidate) => candidate.key === column.type);
  const parsed = parseColumnSql(type?.sql_type ?? 'TEXT');
  const isEnum = column.type === 'enum' || column.enum_values.length > 0;
  return {
    name: column.name,
    sql_type: parsed.sql_type,
    // Vocabulary types that are always NOT NULL (boolean, text arrays) stay NOT NULL.
    not_null: !column.nullable || parsed.not_null,
    default_sql: column.default_sql.trim() || parsed.default_sql,
    enum_values: isEnum ? column.enum_values : [],
    references_table: column.references_table,
    on_delete: column.on_delete,
    is_unique: column.is_unique,
    is_indexed: column.is_indexed || Boolean(column.references_table),
    ts_type: type ? readTsType(type.ts_type) : tsTypeForSql(parsed.sql_type),
    description: column.description,
  };
};

/** Columns a lifecycle option adds (is_active, deleted_at, status…), parsed from columns_sql. */
const lifecycleColumns = (lifecycleKey: string, vocabulary: CodegenVocabulary): RenderColumn[] => {
  const option = vocabulary.lifecycle_options.find((candidate) => candidate.key === lifecycleKey);
  if (!option?.columns_sql.trim()) return [];
  return option.columns_sql
    .split(/,(?![^(]*\))/)
    .map((definition) => parseColumnDefinition(definition))
    .filter((parsed): parsed is NonNullable<typeof parsed> => parsed !== null)
    .map((parsed) => ({
      name: parsed.name,
      sql_type: parsed.sql_type,
      not_null: parsed.not_null,
      default_sql: parsed.default_sql,
      enum_values: parsed.enum_values,
      references_table: '',
      on_delete: 'none' as const,
      is_unique: false,
      is_indexed: parsed.name === 'status' || parsed.name === 'is_active',
      ts_type: tsTypeForSql(parsed.sql_type),
      description: `Lifecycle (${option.name}).`,
    }));
};

/**
 * The table's own columns (proposal order) plus any lifecycle columns it does not already define.
 * Standard columns (id, created_at, updated_at) are not included; renderers add them.
 */
export const buildRenderColumns = (table: ProposedTable, vocabulary: CodegenVocabulary): RenderColumn[] => {
  const columns = table.columns.map((column) => fromProposedColumn(column, vocabulary));
  const names = new Set(columns.map((column) => column.name));
  const extra = lifecycleColumns(table.lifecycle, vocabulary).filter((column) => !names.has(column.name));
  return [...columns, ...extra];
};
