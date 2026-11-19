import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import { parseGithubRepoUrl } from '../../utils/parse-github-repo-url';
import { CRUD_WIRING_PATHS, type CodegenRole, type CrudRepoState, type RepoRenderState } from '../codegen';
import { getDefaultBranchHead, getFileText, listDirectoryNames, listTreePaths, type GithubRepoRef } from '../github';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';

/** A repo's default branch head. */
export type RepoHead = {
  ref: GithubRepoRef;
  full_name: string;
  base_branch: string;
  base_sha: string;
};

/**
 * Resolves the repo's default branch and its head commit.
 */
export const readRepoHead = async (repo: SoftwareSystemRepo): Promise<RepoHead> => {
  const parsed = parseGithubRepoUrl(repo.repo_url);
  if (!parsed.success) {
    throw new ProposalRequestError(400, `${repo.name}: ${parsed.error}`);
  }
  const ref = { owner: parsed.owner, repo: parsed.repo };
  const head = await getDefaultBranchHead(ref);
  if (!head.ok) {
    throw new ProposalRequestError(502, `${repo.name}: ${head.error}`);
  }
  if (!head.head_sha) {
    throw new ProposalRequestError(409, `${repo.name} has no commits yet (GitHub may still be copying the template). Try again in a minute.`);
  }
  return { ref, full_name: `${parsed.owner}/${parsed.repo}`, base_branch: head.branch, base_sha: head.head_sha };
};

/**
 * What the data-model renderer needs: migrations list, model barrel, seed table list.
 */
export const readModelRenderState = async (head: RepoHead, role: CodegenRole): Promise<RepoRenderState> => {
  const [migrationFileNames, modelBarrel, seedTableNames] = await Promise.all([
    role === 'storage' ? listDirectoryNames(head.ref, 'migrations', head.base_sha) : Promise.resolve([]),
    getFileText(head.ref, 'src/model/index.ts', head.base_sha),
    role === 'storage' ? getFileText(head.ref, 'src/services/storage/seed-table-names.ts', head.base_sha) : Promise.resolve(null),
  ]);
  return { migration_file_names: migrationFileNames, model_barrel: modelBarrel, seed_table_names: seedTableNames };
};

/**
 * What the CRUD renderer needs: every path (support files are written only when missing)
 * and the wiring files it merges into.
 */
export const readCrudRenderState = async (head: RepoHead, role: CodegenRole): Promise<CrudRepoState> => {
  const [paths, ...contents] = await Promise.all([
    listTreePaths(head.ref, head.base_sha),
    ...CRUD_WIRING_PATHS[role].map((path) => getFileText(head.ref, path, head.base_sha)),
  ]);
  return {
    paths: paths as Set<string>,
    wiring: Object.fromEntries(CRUD_WIRING_PATHS[role].map((path, index) => [path, contents[index] as string | null])),
  };
};
