import type {
  DataModelProposalContent,
  ExcludedTable,
  ProposedColumn,
  ProposedOnDelete,
  ProposedTable,
} from '../../model/data-model-proposal';
import type { DataModelVocabulary } from './types';

const ON_DELETE: ProposedOnDelete[] = ['none', 'cascade', 'set_null', 'restrict'];

const toSnake = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

const toKebab = (value: unknown): string => toSnake(value).replace(/_/g, '-');

const singularize = (tableName: string): string => {
  if (tableName.endsWith('ies')) return `${tableName.slice(0, -3)}y`;
  if (/(ses|xes|zes|ches|shes)$/.test(tableName)) return tableName.slice(0, -2);
  if (tableName.endsWith('s') && !tableName.endsWith('ss')) return tableName.slice(0, -1);
  return tableName;
};

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeColumn = (raw: Partial<ProposedColumn>): ProposedColumn => {
  const type = toSnake(raw.type);
  const referencesTable = toSnake(raw.references_table);
  const onDelete = ON_DELETE.includes(raw.on_delete as ProposedOnDelete) ? (raw.on_delete as ProposedOnDelete) : 'none';
  const enumValues = Array.isArray(raw.enum_values)
    ? [...new Set(raw.enum_values.map((value) => text(value)).filter(Boolean))]
    : [];
  return {
    name: toSnake(raw.name),
    type,
    nullable: raw.nullable === true,
    default_sql: text(raw.default_sql),
    enum_values: type === 'enum' ? enumValues : [],
    references_table: referencesTable,
    on_delete: referencesTable ? onDelete : 'none',
    is_unique: raw.is_unique === true,
    is_indexed: raw.is_indexed === true || Boolean(referencesTable),
    description: text(raw.description),
  };
};

/** Orders tables so every referenced table comes before the tables that reference it. */
const sortByDependencies = (tables: ProposedTable[]): ProposedTable[] => {
  const byName = new Map(tables.map((table) => [table.name, table]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const ordered: ProposedTable[] = [];

  const visit = (table: ProposedTable): void => {
    if (visited.has(table.name) || visiting.has(table.name)) return;
    visiting.add(table.name);
    for (const column of table.columns) {
      const target = byName.get(column.references_table);
      if (target && target.name !== table.name) visit(target);
    }
    visiting.delete(table.name);
    visited.add(table.name);
    ordered.push(table);
  };

  tables.forEach(visit);
  return ordered;
};

/**
 * Cleans the raw AI output: snake_case names, kebab entities, standard columns removed,
 * duplicate tables/columns dropped, enum values only on enum columns, FKs indexed, and
 * tables ordered parents-first. Never adds tables or columns.
 */
export const normalizeProposal = (
  raw: Partial<DataModelProposalContent>,
  vocabulary: DataModelVocabulary,
): DataModelProposalContent => {
  const standard = new Set(vocabulary.standard_column_names);
  const seenTables = new Set<string>();
  const tables: ProposedTable[] = [];

  for (const rawTable of Array.isArray(raw.tables) ? raw.tables : []) {
    const name = toSnake(rawTable?.name);
    if (!name || seenTables.has(name)) continue;
    seenTables.add(name);

    const seenColumns = new Set<string>();
    const columns: ProposedColumn[] = [];
    for (const rawColumn of Array.isArray(rawTable.columns) ? rawTable.columns : []) {
      const column = normalizeColumn(rawColumn ?? {});
      if (!column.name || standard.has(column.name) || seenColumns.has(column.name)) continue;
      seenColumns.add(column.name);
      columns.push(column);
    }

    tables.push({
      name,
      entity: toKebab(rawTable.entity) || toKebab(singularize(name)),
      archetype: toSnake(rawTable.archetype),
      lifecycle: toSnake(rawTable.lifecycle),
      purpose: text(rawTable.purpose),
      why_needed: text(rawTable.why_needed),
      columns,
    });
  }

  const excluded: ExcludedTable[] = (Array.isArray(raw.excluded) ? raw.excluded : [])
    .map((item) => ({ name: text(item?.name), reason: text(item?.reason) }))
    .filter((item) => item.name);

  return {
    summary: text(raw.summary),
    tables: sortByDependencies(tables),
    excluded,
    open_questions: (Array.isArray(raw.open_questions) ? raw.open_questions : [])
      .map((question) => text(question))
      .filter(Boolean),
  };
};
