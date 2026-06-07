/**
 * Parse a GitHub PR URL to extract owner, repo, and pull number.
 * Format: https://github.com/owner/repo/pull/123
 */

export type ParsedPRUrl =
  | { success: true; owner: string; repo: string; pullNumber: number }
  | { success: false; error: string };

export const parsePRUrl = (prUrl: string): ParsedPRUrl => {
  if (!prUrl || typeof prUrl !== 'string') {
    return { success: false, error: 'Invalid PR URL' };
  }

  const match = prUrl.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/|$)/i
  );

  if (!match) {
    return { success: false, error: `Could not parse PR URL: ${prUrl}` };
  }

  const [, owner, repo, pullNumberStr] = match;
  const pullNumber = parseInt(pullNumberStr, 10);

  if (!owner || !repo || isNaN(pullNumber)) {
    return { success: false, error: 'Invalid PR URL structure' };
  }

  return {
    success: true,
    owner,
    repo,
    pullNumber,
  };
};
