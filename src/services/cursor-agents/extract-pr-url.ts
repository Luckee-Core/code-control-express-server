import type { RunResult } from '@cursor/sdk';

const PR_URL_PATTERN = /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+/i;

/**
 * GitHub PR URL from a finished Cursor run (git branch info first, then the run's text).
 */
export const extractPrUrl = (result: Pick<RunResult, 'git' | 'result'>): string | null => {
  for (const branch of result.git?.branches ?? []) {
    if (branch.prUrl) return branch.prUrl;
  }
  return (result.result ?? '').match(PR_URL_PATTERN)?.[0] ?? null;
};

/** PR number from a GitHub PR URL, or null. */
export const prNumberFromUrl = (url: string): number | null => {
  const match = url.match(/\/pull\/(\d+)/);
  return match ? Number(match[1]) : null;
};
