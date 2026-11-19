import type { GithubRepoRef } from './repo-contents';
import { repoPath, requestGithub } from './request-github';

/**
 * Replaces a pull request's description.
 */
export const updatePullRequestBody = async (ref: GithubRepoRef, number: number, body: string): Promise<void> => {
  const result = await requestGithub('PATCH', `${repoPath(ref.owner, ref.repo)}/pulls/${number}`, { body });
  if (!result.ok) throw new Error(result.error);
};

/**
 * Current description of a pull request ('' when empty).
 */
export const getPullRequestBody = async (ref: GithubRepoRef, number: number): Promise<string> => {
  const result = await requestGithub<{ body: string | null }>('GET', `${repoPath(ref.owner, ref.repo)}/pulls/${number}`);
  if (!result.ok) throw new Error(result.error);
  return result.data.body ?? '';
};
