import { repoPath, requestGithub } from './request-github';

export type GithubRepoRef = { owner: string; repo: string };

/**
 * Default branch name and the sha it points at. `head_sha` is null while a repo generated
 * from a template has no commit yet.
 */
export const getDefaultBranchHead = async (
  ref: GithubRepoRef,
): Promise<{ ok: true; branch: string; head_sha: string | null } | { ok: false; error: string }> => {
  const repo = await requestGithub<{ default_branch: string }>('GET', repoPath(ref.owner, ref.repo));
  if (!repo.ok) return { ok: false, error: repo.error };
  const branch = repo.data.default_branch;
  const head = await requestGithub<{ object: { sha: string } }>(
    'GET',
    `${repoPath(ref.owner, ref.repo)}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  if (!head.ok) {
    if (head.status === 404 || head.status === 409) return { ok: true, branch, head_sha: null };
    return { ok: false, error: head.error };
  }
  return { ok: true, branch, head_sha: head.data.object.sha };
};

/**
 * Text content of one file at a ref, or null when it does not exist.
 */
export const getFileText = async (ref: GithubRepoRef, path: string, at: string): Promise<string | null> => {
  const result = await requestGithub<{ content?: string; encoding?: string }>(
    'GET',
    `${repoPath(ref.owner, ref.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(at)}`,
  );
  if (!result.ok) {
    if (result.status === 404) return null;
    throw new Error(result.error);
  }
  if (!result.data.content) return '';
  return Buffer.from(result.data.content, (result.data.encoding as BufferEncoding) ?? 'base64').toString('utf8');
};

/**
 * File names directly inside a directory at a ref ([] when the directory does not exist).
 */
export const listDirectoryNames = async (ref: GithubRepoRef, path: string, at: string): Promise<string[]> => {
  const result = await requestGithub<Array<{ name: string; type: string }>>(
    'GET',
    `${repoPath(ref.owner, ref.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(at)}`,
  );
  if (!result.ok) {
    if (result.status === 404) return [];
    throw new Error(result.error);
  }
  return Array.isArray(result.data) ? result.data.filter((item) => item.type === 'file').map((item) => item.name) : [];
};
