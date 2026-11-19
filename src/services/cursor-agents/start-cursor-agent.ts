import { Agent, CursorAgentError } from '@cursor/sdk';
import { getCursorAgentModelId, readCursorApiKey } from './config';

export type StartCursorAgentResult =
  | { success: true; agentId: string; runId: string }
  | { success: false; error: string };

/**
 * Starts a Cursor Cloud agent on one repo with a prompt; the agent opens the PR itself
 * (autoCreatePR). Never throws; returns the error instead. Moved from My Ops Tracker.
 */
export const startCursorAgent = async (input: { repoUrl: string; prompt: string }): Promise<StartCursorAgentResult> => {
  const apiKey = readCursorApiKey();
  if (!apiKey) return { success: false, error: 'CURSOR_API_KEY is not set on the Express server' };
  try {
    const agent = await Agent.create({
      apiKey,
      model: { id: getCursorAgentModelId() },
      cloud: { repos: [{ url: input.repoUrl }], autoCreatePR: true, skipReviewerRequest: true },
    });
    try {
      const run = await agent.send(input.prompt);
      const agentId = agent.agentId?.trim() ?? '';
      const runId = run.id?.trim() ?? '';
      if (!agentId || !runId) return { success: false, error: 'Cursor agent started but returned no run ids' };
      console.log('🤖 [cursor-agents] Started cloud agent', { agentId, runId, repoUrl: input.repoUrl });
      return { success: true, agentId, runId };
    } finally {
      await agent.close();
    }
  } catch (error) {
    if (error instanceof CursorAgentError) return { success: false, error: error.message };
    return { success: false, error: error instanceof Error ? error.message : 'Cursor agent failed to start' };
  }
};
