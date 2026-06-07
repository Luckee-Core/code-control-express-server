/**
 * Request changes on a PR via GitHub Reviews API.
 * Uses GITHUB_PERSONAL_ACCESS_TOKEN.
 */

const GITHUB_API = 'https://api.github.com';

export type RejectPRInput = {
  owner: string;
  repo: string;
  pullNumber: number;
  body?: string;
};

export type RejectPRResult =
  | { success: true }
  | { success: false; error: string };

export const rejectPR = async (
  input: RejectPRInput
): Promise<RejectPRResult> => {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token || !token.trim()) {
    return { success: false, error: 'GITHUB_PERSONAL_ACCESS_TOKEN is not set' };
  }

  const { owner, repo, pullNumber, body = 'Rejected via console' } = input;

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'REQUEST_CHANGES',
        body,
      }),
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

  return { success: true };
};
