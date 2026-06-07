/**
 * Approve or reject (request changes on) a GitHub pull request via review API.
 */

const getToken = () => process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

export type ApprovePRInput = {
  owner: string;
  repo: string;
  pullNumber: number;
  body?: string;
};

export type RejectPRInput = {
  owner: string;
  repo: string;
  pullNumber: number;
  body?: string;
};

export type PRReviewResult = { success: true } | { success: false; error: string };

export const approvePR = async (input: ApprovePRInput): Promise<PRReviewResult> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'GITHUB_TOKEN (or GITHUB_ACCESS_TOKEN) is not set' };
  }

  const { owner, repo, pullNumber, body } = input;
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event: 'APPROVE', body: body || 'LGTM' }),
  });

  if (!response.ok) {
    const res = (await response.json().catch(() => ({}))) as { message?: string };
    return { success: false, error: res.message || response.statusText };
  }
  return { success: true };
};

export const rejectPR = async (input: RejectPRInput): Promise<PRReviewResult> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'GITHUB_TOKEN (or GITHUB_ACCESS_TOKEN) is not set' };
  }

  const { owner, repo, pullNumber, body } = input;
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: 'REQUEST_CHANGES',
      body: body || 'Please address the feedback.',
    }),
  });

  if (!response.ok) {
    const res = (await response.json().catch(() => ({}))) as { message?: string };
    return { success: false, error: res.message || response.statusText };
  }
  return { success: true };
};
