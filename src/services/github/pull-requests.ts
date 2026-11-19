import type { GithubRepoRef } from './repo-contents';
import { repoPath, requestGithub } from './request-github';

export type GithubPullRequest = {
  number: number;
  html_url: string;
  state: 'open' | 'closed';
  merged: boolean;
};

type RawPullRequest = { number: number; html_url: string; state: 'open' | 'closed'; merged?: boolean; merged_at?: string | null };

const toPullRequest = (raw: RawPullRequest): GithubPullRequest => ({
  number: raw.number,
  html_url: raw.html_url,
  state: raw.state,
  merged: Boolean(raw.merged ?? raw.merged_at),
});

/**
 * Commits files on top of `baseSha` as one commit and points `branch` at it (created, or
 * force-updated so a re-delivery replaces the previous commit). Returns the commit sha.
 */
export const commitFilesToBranch = async (input: {
  ref: GithubRepoRef;
  baseSha: string;
  branch: string;
  message: string;
  files: Array<{ path: string; content: string }>;
}): Promise<string> => {
  const base = repoPath(input.ref.owner, input.ref.repo);
  const baseCommit = await requestGithub<{ tree: { sha: string } }>('GET', `${base}/git/commits/${input.baseSha}`);
  if (!baseCommit.ok) throw new Error(baseCommit.error);

  const tree = await requestGithub<{ sha: string }>('POST', `${base}/git/trees`, {
    base_tree: baseCommit.data.tree.sha,
    tree: input.files.map((file) => ({ path: file.path, mode: '100644', type: 'blob', content: file.content })),
  });
  if (!tree.ok) throw new Error(tree.error);

  const commit = await requestGithub<{ sha: string }>('POST', `${base}/git/commits`, {
    message: input.message,
    tree: tree.data.sha,
    parents: [input.baseSha],
  });
  if (!commit.ok) throw new Error(commit.error);

  const refPath = `${base}/git/refs/heads/${input.branch.split('/').map(encodeURIComponent).join('/')}`;
  const updated = await requestGithub('PATCH', refPath, { sha: commit.data.sha, force: true });
  if (!updated.ok) {
    if (updated.status !== 422 && updated.status !== 404) throw new Error(updated.error);
    const created = await requestGithub('POST', `${base}/git/refs`, { ref: `refs/heads/${input.branch}`, sha: commit.data.sha });
    if (!created.ok) throw new Error(created.error);
  }
  return commit.data.sha;
};

/**
 * The open pull request from `branch` into the repo, or null.
 */
export const findOpenPullRequest = async (ref: GithubRepoRef, branch: string): Promise<GithubPullRequest | null> => {
  const result = await requestGithub<RawPullRequest[]>(
    'GET',
    `${repoPath(ref.owner, ref.repo)}/pulls?state=open&head=${encodeURIComponent(`${ref.owner}:${branch}`)}`,
  );
  if (!result.ok) throw new Error(result.error);
  return result.data[0] ? toPullRequest(result.data[0]) : null;
};

/**
 * Opens a pull request from `head` into `base`.
 */
export const createPullRequest = async (input: {
  ref: GithubRepoRef;
  head: string;
  base: string;
  title: string;
  body: string;
}): Promise<GithubPullRequest> => {
  const result = await requestGithub<RawPullRequest>('POST', `${repoPath(input.ref.owner, input.ref.repo)}/pulls`, {
    title: input.title,
    head: input.head,
    base: input.base,
    body: input.body,
  });
  if (!result.ok) throw new Error(result.error);
  return toPullRequest(result.data);
};

/**
 * One pull request's current state (open / closed, merged).
 */
export const getPullRequest = async (ref: GithubRepoRef, number: number): Promise<GithubPullRequest> => {
  const result = await requestGithub<RawPullRequest>('GET', `${repoPath(ref.owner, ref.repo)}/pulls/${number}`);
  if (!result.ok) throw new Error(result.error);
  return toPullRequest(result.data);
};
