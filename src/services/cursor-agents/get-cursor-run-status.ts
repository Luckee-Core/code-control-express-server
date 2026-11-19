import { Agent } from '@cursor/sdk';
import { readCursorApiKey } from './config';
import { extractPrUrl } from './extract-pr-url';

export type CursorRunStatus =
  | { state: 'running' }
  | { state: 'finished'; prUrl: string | null }
  | { state: 'failed'; error: string };

/**
 * One non-blocking status read of a Cursor Cloud run (no waiting; callers poll).
 */
export const getCursorRunStatus = async (agentId: string, runId: string): Promise<CursorRunStatus> => {
  const apiKey = readCursorApiKey();
  if (!apiKey) return { state: 'failed', error: 'CURSOR_API_KEY is not set on the Express server' };
  try {
    const run = await Agent.getRun(runId, { runtime: 'cloud', agentId, apiKey });
    if (run.status === 'finished') return { state: 'finished', prUrl: extractPrUrl(run) };
    if (run.status === 'error' || run.status === 'cancelled') {
      return { state: 'failed', error: run.error?.message ?? `Agent run ${run.status}` };
    }
    return { state: 'running' };
  } catch (error) {
    // A transient read failure is not a failed run; try again on the next poll.
    console.warn('⚠️ [cursor-agents] Could not read run status', {
      runId,
      error: error instanceof Error ? error.message : error,
    });
    return { state: 'running' };
  }
};
