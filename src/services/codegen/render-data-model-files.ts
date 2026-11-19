import type { DataModelProposalContent } from '../../model/data-model-proposal';
import { buildRenderColumns } from './build-render-columns';
import { mergeModelBarrel } from './merge-model-barrel';
import { mergeSeedTableNames } from './merge-seed-table-names';
import { renderMigration } from './render-migration';
import { renderModel } from './render-model';
import type { CodegenRole, CodegenVocabulary, RenderedFile, RepoRenderState } from './types';

const MODEL_BARREL = 'src/model/index.ts';
const SEED_TABLE_NAMES = 'src/services/storage/seed-table-names.ts';

/** Highest NNN prefix in migrations/ (0 when empty). */
export const highestMigrationNumber = (fileNames: string[]): number =>
  fileNames.reduce((max, name) => {
    const match = /^(\d{3,})/.exec(name);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

/**
 * Renders the data-model files for one repo role from an approved proposal:
 * storage → migrations + src/model + barrel + seed table list; express/web → src/model + barrel.
 * `state` is what the repo's default branch already has, so numbering and merges are correct.
 */
export const renderDataModelFiles = (input: {
  role: CodegenRole;
  content: DataModelProposalContent;
  vocabulary: CodegenVocabulary;
  version: number;
  state: RepoRenderState;
}): RenderedFile[] => {
  const { role, content, vocabulary, version, state } = input;
  const files: RenderedFile[] = [];
  const tables = content.tables.map((table) => ({ table, columns: buildRenderColumns(table, vocabulary) }));

  if (role === 'storage') {
    let next = highestMigrationNumber(state.migration_file_names) + 1;
    for (const { table, columns } of tables) {
      const number = String(next).padStart(3, '0');
      next += 1;
      files.push({
        role,
        path: `migrations/${number}_create_${table.name}.sql`,
        content: renderMigration({ table, columns, vocabulary, version }),
        action: 'create',
      });
    }
  }

  for (const { table, columns } of tables) {
    files.push({
      role,
      path: `src/model/${table.entity}/index.ts`,
      content: renderModel({ table, columns, vocabulary }),
      action: 'create',
    });
  }

  const barrel = mergeModelBarrel(
    state.model_barrel,
    tables.map(({ table }) => table.entity),
  );
  if (barrel !== null) {
    files.push({ role, path: MODEL_BARREL, content: barrel, action: state.model_barrel === null ? 'create' : 'update' });
  }

  if (role === 'storage' && state.seed_table_names !== null) {
    const seed = mergeSeedTableNames(
      state.seed_table_names,
      tables.map(({ table }) => table.name),
    );
    if (seed !== null) {
      files.push({ role, path: SEED_TABLE_NAMES, content: seed, action: 'update' });
    }
  }

  return files;
};
