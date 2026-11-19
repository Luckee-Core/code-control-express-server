import type { ProposedTable } from '../../model/data-model-proposal';
import { toKebabCase, toPascalCase } from './naming';
import type { CodegenVocabulary, RenderColumn } from './types';

/** Names for one table, derived once and shared by every CRUD renderer. */
export type TableNames = {
  table: string;
  /** src/model/{entity} folder (singular kebab). */
  entity: string;
  /** src/data/{folder}, src/services/{folder}, src/api/{folder}, route segment (plural kebab). */
  folder: string;
  Entity: string;
  Things: string;
  entityCamel: string;
  thingsCamel: string;
};

export type CrudOperationKind = 'list' | 'list_by' | 'get_by_id' | 'create' | 'update' | 'delete';

/** One standard data operation (storage function = express wrapper = web request name). */
export type CrudOperation = {
  kind: CrudOperationKind;
  name: string;
  /** Kebab file name without .ts. */
  file: string;
  /** Filter column for list_by. */
  column: string;
};

/** Everything the CRUD renderers need for one table. */
export type CrudTable = {
  names: TableNames;
  table: ProposedTable;
  columns: RenderColumn[];
  operations: CrudOperation[];
  /** SQL ORDER BY for lists. */
  orderBy: string;
  /** Lifecycle read filter for lists (e.g. `deleted_at IS NULL`), '' when none. */
  readFilter: string;
  /** deleted_at lifecycle: delete sets deleted_at instead of removing the row. */
  softDelete: boolean;
};

const camel = (pascal: string): string => pascal.charAt(0).toLowerCase() + pascal.slice(1);

/** camelCase → kebab-case (getBusinessFactById → get-business-fact-by-id). */
export const camelToKebab = (value: string): string => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export const buildTableNames = (table: ProposedTable): TableNames => {
  const Entity = toPascalCase(table.entity);
  const Things = toPascalCase(table.name);
  return {
    table: table.name,
    entity: table.entity,
    folder: toKebabCase(table.name),
    Entity,
    Things,
    entityCamel: camel(Entity),
    thingsCamel: camel(Things),
  };
};

/**
 * Standard operations (dm.data.standard_operations): list, get by id, one list-by per foreign
 * key, create, update, delete. Names follow the entity / table names.
 */
export const buildCrudOperations = (names: TableNames, columns: RenderColumn[]): CrudOperation[] => {
  const op = (kind: CrudOperationKind, name: string, column = ''): CrudOperation => ({
    kind,
    name,
    file: camelToKebab(name),
    column,
  });
  const listBys = columns
    .filter((column) => column.references_table)
    .map((column) => op('list_by', `get${names.Things}By${toPascalCase(column.name)}`, column.name));
  return [
    op('list', `list${names.Things}`),
    op('get_by_id', `get${names.Entity}ById`),
    ...listBys,
    op('create', `create${names.Entity}`),
    op('update', `update${names.Entity}`),
    op('delete', `delete${names.Entity}`),
  ];
};

/**
 * Resolves names, operations, list order and lifecycle behavior for every table.
 */
export const buildCrudTables = (
  tables: Array<{ table: ProposedTable; columns: RenderColumn[] }>,
  vocabulary: CodegenVocabulary,
): CrudTable[] =>
  tables.map(({ table, columns }) => {
    const names = buildTableNames(table);
    const lifecycle = vocabulary.lifecycle_options.find((option) => option.key === table.lifecycle);
    const hasSortOrder = columns.some((column) => column.name === 'sort_order');
    return {
      names,
      table,
      columns,
      operations: buildCrudOperations(names, columns),
      orderBy: hasSortOrder ? 'sort_order ASC, created_at DESC' : 'created_at DESC',
      readFilter: (lifecycle?.read_filter ?? '').trim().replace(/^WHERE\s+/i, ''),
      softDelete: columns.some((column) => column.name === 'deleted_at'),
    };
  });
