import type { GithubRepoRef } from './repo-contents';
import { repoPath, requestGithub } from './request-github';

export type GithubPullRequest = {
  number: number;
  html_url: string;
  state: 'open' | 'closed';
  merged: boolean;
  /** Branch the PR was opened from. */
  head_ref: string;
  head_sha: string;
  base_ref: string;
  /** Squash/merge commit on the base branch once merged. */
  merge_commit_sha: string | null;
};

type RawPullRequest = {
  number: number;
  html_url: string;
  state: 'open' | 'closed';
  merged?: boolean;
  merged_at?: string | null;
  merge_commit_sha?: string | null;
  head?: { ref?: string; sha?: string };
  base?: { ref?: string };
};

const toPullRequest = (raw: RawPullRequest): GithubPullRequest => ({
  number: raw.number,
  html_url: raw.html_url,
  state: raw.state,
  merged: Boolean(raw.merged ?? raw.merged_at),
  head_ref: raw.head?.ref ?? '',
  head_sha: raw.head?.sha ?? '',
  base_ref: raw.base?.ref ?? '',
  merge_commit_sha: raw.merge_commit_sha ?? null,
});

/**
 * Commits files on top of `baseSha` as one commit and points `branch` at it (created, or
 * force-updated so a re-delivery replaces the previous commit). Returns the commit sha.
 * A file with `content: null` is deleted (a tree entry with `sha: null`).
 */
export const commitFilesToBranch = async (input: {
  ref: GithubRepoRef;
  baseSha: string;
  branch: string;
  message: string;
  files: Array<{ path: string; content: string | null }>;
}): Promise<string> => {
  const base = repoPath(input.ref.owner, input.ref.repo);
  const baseCommit = await requestGithub<{ tree: { sha: string } }>('GET', `${base}/git/commits/${input.baseSha}`);
  if (!baseCommit.ok) throw new Error(baseCommit.error);

  const tree = await requestGithub<{ sha: string }>('POST', `${base}/git/trees`, {
    base_tree: baseCommit.data.tree.sha,
    tree: input.files.map((file) =>
      file.content === null
        ? { path: file.path, mode: '100644', type: 'blob', sha: null }
        : { path: file.path, mode: '100644', type: 'blob', content: file.content },
    ),
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

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Squash-merges a pull request. GitHub computes mergeability right after a PR opens, so a
 * "not mergeable yet" answer (405/409) is retried a few times. Returns the error when it can't merge.
 */
export const mergePullRequest = async (input: {
  ref: GithubRepoRef;
  number: number;
  /** Squash commit title; GitHub's default (the PR title) when omitted. */
  title?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> => {
  let lastError = '';
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) await wait(1500 * attempt);
    const result = await requestGithub<{ merged: boolean }>(
      'PUT',
      `${repoPath(input.ref.owner, input.ref.repo)}/pulls/${input.number}/merge`,
      input.title ? { merge_method: 'squash', commit_title: `${input.title} (#${input.number})` } : { merge_method: 'squash' },
    );
    if (result.ok && result.data.merged) return { ok: true };
    lastError = result.ok ? 'GitHub did not merge the pull request' : result.error;
    if (!result.ok && result.status !== 405 && result.status !== 409) break;
  }
  return { ok: false, error: lastError };
};

/**
 * Deletes a branch (best effort; used after a merge).
 */
export const deleteBranch = async (ref: GithubRepoRef, branch: string): Promise<void> => {
  await requestGithub('DELETE', `${repoPath(ref.owner, ref.repo)}/git/refs/heads/${branch.split('/').map(encodeURIComponent).join('/')}`);
};

/**
 * One pull request's current state (open / closed, merged).
 */
export const getPullRequest = async (ref: GithubRepoRef, number: number): Promise<GithubPullRequest> => {
  const result = await requestGithub<RawPullRequest>('GET', `${repoPath(ref.owner, ref.repo)}/pulls/${number}`);
  if (!result.ok) throw new Error(result.error);
  return toPullRequest(result.data);
};

/**
 * Closes a pull request without merging, optionally leaving a comment first.
 */
export const closePullRequest = async (input: { ref: GithubRepoRef; number: number; comment?: string }): Promise<void> => {
  const base = repoPath(input.ref.owner, input.ref.repo);
  if (input.comment?.trim()) {
    const commented = await requestGithub('POST', `${base}/issues/${input.number}/comments`, { body: input.comment.trim() });
    if (!commented.ok) console.warn('⚠️ [github] Could not comment before closing', { pr: input.number, error: commented.error });
  }
  const result = await requestGithub('PATCH', `${base}/pulls/${input.number}`, { state: 'closed' });
  if (!result.ok) throw new Error(result.error);
};

/**
 * Adds a comment to a pull request (best effort).
 */
export const commentOnPullRequest = async (ref: GithubRepoRef, number: number, body: string): Promise<void> => {
  const result = await requestGithub('POST', `${repoPath(ref.owner, ref.repo)}/issues/${number}/comments`, { body });
  if (!result.ok) console.warn('⚠️ [github] Could not comment', { pr: number, error: result.error });
};

export type GithubCompareFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  /** Unified diff hunk text (absent for binary or very large files). */
  patch: string | null;
};

/**
 * Files changed between two commits (GitHub compare), with patches.
 */
export const compareCommits = async (ref: GithubRepoRef, base: string, head: string): Promise<GithubCompareFile[]> => {
  const result = await requestGithub<{ files?: Array<{ filename: string; status: string; additions: number; deletions: number; patch?: string }> }>(
    'GET',
    `${repoPath(ref.owner, ref.repo)}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
  );
  if (!result.ok) throw new Error(result.error);
  return (result.data.files ?? []).map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch ?? null,
  }));
};
