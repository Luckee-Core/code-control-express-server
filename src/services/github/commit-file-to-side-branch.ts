import { getBranchHeadSha, type GithubRepoRef } from './repo-contents';
import { repoPath, requestGithub } from './request-github';

/**
 * Adds one binary file (base64) to `branch`, creating the branch as an orphan (no shared history
 * with the default branch) the first time. Used for images PR bodies link to, so nothing lands on
 * main. Returns a URL GitHub renders in Markdown for anyone who can see the repo.
 */
export const commitFileToSideBranch = async (input: {
  ref: GithubRepoRef;
  branch: string;
  path: string;
  base64: string;
  message: string;
}): Promise<string> => {
  const base = repoPath(input.ref.owner, input.ref.repo);
  const blob = await requestGithub<{ sha: string }>('POST', `${base}/git/blobs`, { content: input.base64, encoding: 'base64' });
  if (!blob.ok) throw new Error(blob.error);

  const head = await getBranchHeadSha(input.ref, input.branch);
  let baseTree: string | undefined;
  if (head) {
    const headCommit = await requestGithub<{ tree: { sha: string } }>('GET', `${base}/git/commits/${head}`);
    if (!headCommit.ok) throw new Error(headCommit.error);
    baseTree = headCommit.data.tree.sha;
  }
  const tree = await requestGithub<{ sha: string }>('POST', `${base}/git/trees`, {
    ...(baseTree ? { base_tree: baseTree } : {}),
    tree: [{ path: input.path, mode: '100644', type: 'blob', sha: blob.data.sha }],
  });
  if (!tree.ok) throw new Error(tree.error);
  const commit = await requestGithub<{ sha: string }>('POST', `${base}/git/commits`, {
    message: input.message,
    tree: tree.data.sha,
    parents: head ? [head] : [],
  });
  if (!commit.ok) throw new Error(commit.error);

  const branchPath = input.branch.split('/').map(encodeURIComponent).join('/');
  const moved = head
    ? await requestGithub('PATCH', `${base}/git/refs/heads/${branchPath}`, { sha: commit.data.sha })
    : await requestGithub('POST', `${base}/git/refs`, { ref: `refs/heads/${input.branch}`, sha: commit.data.sha });
  if (!moved.ok) throw new Error(moved.error);

  const filePath = input.path.split('/').map(encodeURIComponent).join('/');
  return `https://github.com/${input.ref.owner}/${input.ref.repo}/blob/${branchPath}/${filePath}?raw=true`;
};
