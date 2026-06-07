/**
 * List files changed in a GitHub pull request.
 */

const getToken = () => process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

export type GetPRFilesInput = {
  owner: string;
  repo: string;
  pullNumber: number;
};

export type GetPRFilesResult =
  | { success: true; files: Array<Record<string, unknown>> }
  | { success: false; error: string };

export const getPRFiles = async (
  input: GetPRFilesInput
): Promise<GetPRFilesResult> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'GITHUB_TOKEN (or GITHUB_ACCESS_TOKEN) is not set' };
  }

  const { owner, repo, pullNumber } = input;
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    return { success: false, error: body.message || response.statusText };
  }

  const files = (await response.json()) as Array<Record<string, unknown>>;
  return { success: true, files };
};
