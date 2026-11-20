/** GitHub REST base URL (GITHUB_API_URL overrides it, e.g. GitHub Enterprise or a local test double). */
const githubApiUrl = (): string => (process.env.GITHUB_API_URL?.trim() || 'https://api.github.com').replace(/\/$/, '');

export type GithubResponse<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

/**
 * Calls the GitHub REST API with GITHUB_PERSONAL_ACCESS_TOKEN. Never throws for HTTP errors;
 * returns `{ ok: false, status, error }` instead (status 0 when the token is missing or fetch fails).
 */
export const requestGithub = async <T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<GithubResponse<T>> => {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN?.trim();
  if (!token) {
    return { ok: false, status: 0, error: 'GITHUB_PERSONAL_ACCESS_TOKEN is not set' };
  }
  try {
    const response = await fetch(`${githubApiUrl()}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const message = (json as { message?: string } | null)?.message ?? response.statusText;
      return { ok: false, status: response.status, error: `GitHub API (${response.status}): ${message}` };
    }
    return { ok: true, status: response.status, data: json as T };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : 'GitHub request failed' };
  }
};

/** owner/repo path segment, URL-encoded. */
export const repoPath = (owner: string, repo: string): string =>
  `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
