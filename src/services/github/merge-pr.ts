/**
 * Merge a PR via GitHub API.
 * Uses GITHUB_PERSONAL_ACCESS_TOKEN.
 */

const GITHUB_API = 'https://api.github.com';

export type MergeMethod = 'merge' | 'squash' | 'rebase';

export type MergePRInput = {
  owner: string;
  repo: string;
  pullNumber: number;
  mergeMethod?: MergeMethod;
  commitTitle?: string;
};

export type MergePRResult =
  | { success: true; sha?: string }
  | { success: false; error: string };

export const mergePR = async (input: MergePRInput): Promise<MergePRResult> => {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token || !token.trim()) {
    return { success: false, error: 'GITHUB_PERSONAL_ACCESS_TOKEN is not set' };
  }

  const {
    owner,
    repo,
    pullNumber,
    mergeMethod = 'squash',
    commitTitle,
  } = input;

  const body: Record<string, string> = {
    merge_method: mergeMethod,
  };
  if (commitTitle) {
    body.commit_title = commitTitle;
  }

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      errors?: Array<{ message?: string }>;
    };
    const message = body.message || body.errors?.[0]?.message || res.statusText;
    return { success: false, error: `GitHub API: ${message}` };
  }

  const data = (await res.json()) as { sha?: string };
  return { success: true, sha: data.sha };
};
