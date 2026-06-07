/**
 * Fetch PR metadata from GitHub API.
 * Uses GITHUB_PERSONAL_ACCESS_TOKEN.
 */

const GITHUB_API = 'https://api.github.com';

export type GetPRDetailsInput = {
  owner: string;
  repo: string;
  pullNumber: number;
};

export type GitHubPRDetails = {
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  mergeable: boolean | null;
  merged: boolean;
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  html_url: string;
  number: number;
  additions: number;
  deletions: number;
  changed_files: number;
};

export type GetPRDetailsResult =
  | { success: true; pr: GitHubPRDetails }
  | { success: false; error: string };

export const getPRDetails = async (
  input: GetPRDetailsInput
): Promise<GetPRDetailsResult> => {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token || !token.trim()) {
    return { success: false, error: 'GITHUB_PERSONAL_ACCESS_TOKEN is not set' };
  }

  const { owner, repo, pullNumber } = input;

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
      },
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

  const data = (await res.json()) as {
    title: string;
    body: string | null;
    state: string;
    mergeable: boolean | null;
    merged: boolean;
    user: { login: string; avatar_url: string };
    created_at: string;
    updated_at: string;
    html_url: string;
    number: number;
    additions: number;
    deletions: number;
    changed_files: number;
  };

  const pr: GitHubPRDetails = {
    title: data.title,
    body: data.body,
    state: data.state === 'open' ? 'open' : 'closed',
    mergeable: data.mergeable,
    merged: data.merged,
    user: data.user,
    created_at: data.created_at,
    updated_at: data.updated_at,
    html_url: data.html_url,
    number: data.number,
    additions: data.additions,
    deletions: data.deletions,
    changed_files: data.changed_files,
  };

  return { success: true, pr };
};
