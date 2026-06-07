/**
 * Merge a GitHub pull request by PR URL.
 * Uses GITHUB_TOKEN env var. Throws on API error (405 already merged, 409 conflict, etc.).
 */

const GITHUB_MERGE_REGEX = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i;

export type MergePullRequestResult = {
  merged: true;
  sha?: string;
};

/**
 * Parse a GitHub PR URL into owner, repo, pull_number.
 */
export const parsePrUrl = (prUrl: string): { owner: string; repo: string; pullNumber: number } | null => {
  const match = prUrl.trim().match(GITHUB_MERGE_REGEX);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
    pullNumber: parseInt(match[3], 10),
  };
};

/**
 * Merge a pull request using the GitHub REST API.
 * @param prUrl - Full PR URL (e.g. https://github.com/owner/repo/pull/123)
 * @returns Merge result or throws with message from GitHub
 */
export const mergePullRequest = async (prUrl: string): Promise<MergePullRequestResult> => {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN (or GITHUB_ACCESS_TOKEN) is not set');
  }

  const parsed = parsePrUrl(prUrl);
  if (!parsed) {
    throw new Error(`Invalid GitHub PR URL: ${prUrl}`);
  }

  const { owner, repo, pullNumber } = parsed;
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/merge`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ merge_method: 'merge' }),
  });

  if (response.ok) {
    const data = (await response.json()) as { sha?: string };
    return { merged: true, sha: data.sha };
  }

  const body = await response.json().catch(() => ({})) as { message?: string };
  const message = body.message || response.statusText;

  if (response.status === 405) {
    throw new Error(`PR already merged: ${message}`);
  }
  if (response.status === 409) {
    throw new Error(`Merge conflict: ${message}`);
  }
  if (response.status === 404) {
    throw new Error(`PR not found: ${message}`);
  }

  throw new Error(`GitHub merge failed (${response.status}): ${message}`);
};

export type MergePRInput = {
  owner: string;
  repo: string;
  pullNumber: number;
  mergeMethod?: 'merge' | 'squash' | 'rebase';
};

export type MergePRResult =
  | { success: true; sha?: string }
  | { success: false; error: string };

/**
 * Merge a pull request by owner/repo/pullNumber. Returns result object instead of throwing.
 */
export const mergePR = async (input: MergePRInput): Promise<MergePRResult> => {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
  if (!token) {
    return { success: false, error: 'GITHUB_TOKEN (or GITHUB_ACCESS_TOKEN) is not set' };
  }

  const { owner, repo, pullNumber, mergeMethod = 'merge' } = input;
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/merge`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ merge_method: mergeMethod }),
  });

  if (response.ok) {
    const data = (await response.json().catch(() => ({}))) as { sha?: string };
    return { success: true, sha: data.sha };
  }

  const body = (await response.json().catch(() => ({}))) as { message?: string };
  return { success: false, error: body.message || response.statusText };
};
