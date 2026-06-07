/**
 * Get GitHub pull request details via REST API.
 */

const getToken = () => process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

export type GetPRDetailsInput = {
  owner: string;
  repo: string;
  pullNumber: number;
};

export type GetPRDetailsResult =
  | { success: true; pr: Record<string, unknown> }
  | { success: false; error: string };

export const getPRDetails = async (
  input: GetPRDetailsInput
): Promise<GetPRDetailsResult> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'GITHUB_TOKEN (or GITHUB_ACCESS_TOKEN) is not set' };
  }

  const { owner, repo, pullNumber } = input;
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`;

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

  const pr = (await response.json()) as Record<string, unknown>;
  return { success: true, pr };
};
