import type { DataModelProposalContent } from '../../model/data-model-proposal';
import { buildRenderColumns } from './build-render-columns';
import { buildCrudTables } from './crud-operations';
import {
  mergeExpressDataRouter,
  mergeExpressIndex,
  mergeStorageRegistry,
  mergeWebReducer,
  type MergeResult,
} from './merge-crud-wiring';
import { renderExpressCrud } from './render-crud-express';
import { renderStorageCrud } from './render-crud-storage';
import { renderWebCrud } from './render-crud-web';
import { EXPRESS_SUPPORT_FILES, WEB_SUPPORT_FILES } from './support-files';
import type { CodegenRole, CodegenVocabulary, RenderedFile, RenderFinding } from './types';

/** Files to read from the repo's default branch before rendering CRUD for a role. */
export const CRUD_WIRING_PATHS: Record<CodegenRole, string[]> = {
  storage: ['src/services/storage/build-storage-operation-registry.ts'],
  express: ['index.ts', 'src/services/api-data/router.ts'],
  web: ['src/store/reducer.ts'],
};

/** What the CRUD renderer needs to know about the target repo. */
export type CrudRepoState = {
  /** Every file path on the default branch (for "write support file only if missing"). */
  paths: Set<string>;
  /** Contents of CRUD_WIRING_PATHS (null when missing). */
  wiring: Record<string, string | null>;
};

const SUPPORT: Record<CodegenRole, typeof EXPRESS_SUPPORT_FILES> = {
  storage: [],
  express: EXPRESS_SUPPORT_FILES,
  web: WEB_SUPPORT_FILES,
};

/**
 * Renders the data-access layer for one role from an approved data model: storage CRUD + registry;
 * express invoke wrappers + services + /api/data mount; web api + dumps + thunks + reducer.
 * Table files are always (re)written; support files only when missing; wiring files are merged.
 * Wiring that can't be merged safely comes back as a finding instead of a guessed edit.
 */
export const renderCrudFiles = (input: {
  role: CodegenRole;
  content: DataModelProposalContent;
  vocabulary: CodegenVocabulary;
  state: CrudRepoState;
}): { files: RenderedFile[]; findings: RenderFinding[] } => {
  const { role, content, vocabulary, state } = input;
  const tables = buildCrudTables(
    content.tables.map((table) => ({ table, columns: buildRenderColumns(table, vocabulary) })),
    vocabulary,
  );
  const files: RenderedFile[] = [];
  const findings: RenderFinding[] = [];
  const add = (path: string, fileContent: string) =>
    files.push({ role, path, content: fileContent, action: state.paths.has(path) ? 'update' : 'create' });

  for (const support of SUPPORT[role]) {
    if (!state.paths.has(support.path)) add(support.path, support.content);
  }

  const render = role === 'storage' ? renderStorageCrud : role === 'express' ? renderExpressCrud : renderWebCrud;
  for (const crud of tables) {
    for (const file of render(crud)) add(file.path, file.content);
  }

  const merge = (path: string, result: MergeResult) => {
    if ('content' in result) add(path, result.content);
    if ('error' in result) {
      findings.push({ severity: 'error', role, path, message: `${result.error}. Wire it by hand.`, convention_key: 'codegen.wiring' });
    }
  };
  if (role === 'storage') {
    const path = CRUD_WIRING_PATHS.storage[0];
    merge(path, mergeStorageRegistry(state.wiring[path] ?? null, tables));
  }
  if (role === 'express') {
    merge('src/services/api-data/router.ts', mergeExpressDataRouter(state.wiring['src/services/api-data/router.ts'] ?? null, tables));
    merge('index.ts', mergeExpressIndex(state.wiring['index.ts'] ?? null));
  }
  if (role === 'web') {
    merge('src/store/reducer.ts', mergeWebReducer(state.wiring['src/store/reducer.ts'] ?? null, tables));
  }

  return { files, findings };
};
