import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import { parseGithubRepoUrl } from '../../utils/parse-github-repo-url';
import { getDefaultBranchHead, type GithubRepoRef } from '../github';
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
 * Default branch head of a repo given as owner/repo.
 */
export const readRepoHeadByFullName = async (fullName: string): Promise<RepoHead> => {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) throw new ProposalRequestError(400, `Invalid repo name: ${fullName}`);
  const ref = { owner, repo };
  const head = await getDefaultBranchHead(ref);
  if (!head.ok) throw new ProposalRequestError(502, `${fullName}: ${head.error}`);
  if (!head.head_sha) throw new ProposalRequestError(409, `${fullName} has no commits yet`);
  return { ref, full_name: fullName, base_branch: head.branch, base_sha: head.head_sha };
};
