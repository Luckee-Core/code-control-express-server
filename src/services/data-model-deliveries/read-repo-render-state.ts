import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import { parseGithubRepoUrl } from '../../utils/parse-github-repo-url';
import type { CodegenRole, RepoRenderState } from '../codegen';
import { getDefaultBranchHead, getFileText, listDirectoryNames, type GithubRepoRef } from '../github';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';

export type RepoSnapshot = {
  ref: GithubRepoRef;
  full_name: string;
  base_branch: string;
  base_sha: string;
  state: RepoRenderState;
};

/**
 * Reads what the repo's default branch already has (migrations, model barrel, seed table list)
 * so rendering numbers migrations and merges barrels correctly.
 */
export const readRepoRenderState = async (repo: SoftwareSystemRepo, role: CodegenRole): Promise<RepoSnapshot> => {
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

  const [migrationFileNames, modelBarrel, seedTableNames] = await Promise.all([
    role === 'storage' ? listDirectoryNames(ref, 'migrations', head.head_sha) : Promise.resolve([]),
    getFileText(ref, 'src/model/index.ts', head.head_sha),
    role === 'storage' ? getFileText(ref, 'src/services/storage/seed-table-names.ts', head.head_sha) : Promise.resolve(null),
  ]);

  return {
    ref,
    full_name: `${parsed.owner}/${parsed.repo}`,
    base_branch: head.branch,
    base_sha: head.head_sha,
    state: {
      migration_file_names: migrationFileNames,
      model_barrel: modelBarrel,
      seed_table_names: seedTableNames,
    },
  };
};
