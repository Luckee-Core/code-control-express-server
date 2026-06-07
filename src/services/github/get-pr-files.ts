/**
 * Fetch PR changed files and diffs from GitHub API.
 * Uses GITHUB_PERSONAL_ACCESS_TOKEN.
 */

const GITHUB_API = 'https://api.github.com';

export type GetPRFilesInput = {
  owner: string;
  repo: string;
  pullNumber: number;
};

export type PRFile = {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  patch: string | null;
};

export type GetPRFilesResult =
  | { success: true; files: PRFile[] }
  | { success: false; error: string };

export const getPRFiles = async (
  input: GetPRFilesInput
): Promise<GetPRFilesResult> => {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token || !token.trim()) {
    return { success: false, error: 'GITHUB_PERSONAL_ACCESS_TOKEN is not set' };
  }

  const { owner, repo, pullNumber } = input;

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
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

  const data = (await res.json()) as Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch: string | null;
  }>;

  const files: PRFile[] = data.map((f) => ({
    filename: f.filename,
    status:
      f.status === 'added'
        ? 'added'
        : f.status === 'removed'
          ? 'removed'
          : f.status === 'renamed'
            ? 'renamed'
            : 'modified',
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch,
  }));

  return { success: true, files };
};
