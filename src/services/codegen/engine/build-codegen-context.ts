import type { DataModelProposalContent } from '../../../model/data-model-proposal';
import { buildRenderColumns } from '../build-render-columns';
import { buildCrudTables, type CrudOperation, type CrudTable } from '../crud-operations';
import type { CodegenRole, CodegenVocabulary } from '../types';
import { templateHelpers, type TemplateHelpers } from './helpers';
import type { CodegenKind, CodegenRepoState } from './types';

/** Data every template receives as `it`. */
export type CodegenContext = {
  role: CodegenRole;
  kind: CodegenKind;
  /** Approved data-model version. */
  version: number;
  vocabulary: CodegenVocabulary;
  /** Standard columns sorted by sort_order. */
  standard_columns: CodegenVocabulary['standard_columns'];
  /** Every table: names, columns, operations, list order, lifecycle behavior. */
  tables: CrudTable[];
  /** Next free migrations/NNN number in the repo (highest + 1). */
  migrations: { next: number };
  h: TemplateHelpers;
};

/** `it` for each = table / operation renders. */
export type CodegenItemContext = CodegenContext & {
  crud: CrudTable;
  table: CrudTable['table'];
  names: CrudTable['names'];
  columns: CrudTable['columns'];
  index: number;
  op?: CrudOperation;
};

/** Highest NNN prefix among files directly in migrations/ (0 when none). */
export const highestMigrationNumberInPaths = (paths: Set<string> | null): number => {
  if (!paths) return 0;
  let max = 0;
  for (const path of paths) {
    const match = /^migrations\/(\d{3,})[^/]*$/.exec(path);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
};

/**
 * Builds the template data for one role and kind from an approved data model: resolved columns,
 * names and standard operations per table (data logic only; no code shape).
 */
export const buildCodegenContext = (input: {
  role: CodegenRole;
  kind: CodegenKind;
  content: DataModelProposalContent;
  vocabulary: CodegenVocabulary;
  version: number;
  state: CodegenRepoState;
  /** Overrides the migration number derived from state.paths (e.g. from a migrations/ listing). */
  highestMigrationNumber?: number;
}): CodegenContext => {
  const tables = buildCrudTables(
    input.content.tables.map((table) => ({ table, columns: buildRenderColumns(table, input.vocabulary) })),
    input.vocabulary,
  );
  const highest = input.highestMigrationNumber ?? highestMigrationNumberInPaths(input.state.paths);
  return {
    role: input.role,
    kind: input.kind,
    version: input.version,
    vocabulary: input.vocabulary,
    standard_columns: [...input.vocabulary.standard_columns].sort((a, b) => a.sort_order - b.sort_order),
    tables,
    migrations: { next: highest + 1 },
    h: templateHelpers,
  };
};

export const itemContext = (base: CodegenContext, crud: CrudTable, index: number, op?: CrudOperation): CodegenItemContext => ({
  ...base,
  crud,
  table: crud.table,
  names: crud.names,
  columns: crud.columns,
  index,
  ...(op ? { op } : {}),
});
