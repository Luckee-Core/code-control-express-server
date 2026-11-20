import { getAgentRunById, listAgentRuns, updateAgentRun } from '../../data/agent-runs';
import type { CanonicalDataClient } from '../canonical-data-client';
import { getManagedCanonicalDataClient } from '../canonical-data-client';
import { runConventionAgent } from '../convention-agent/run-convention-agent';
import { runPrAgent } from '../pr-agent/run-pr-agent';
import { runTemplateAgent } from '../template-agent/run-template-agent';
import { syncTemplateDrafts } from './sync-template-drafts';

/** Runs executing in this process (a run is only ever executed once at a time). */
const active = new Set<string>();

export const isRunActive = (runId: string): boolean => active.has(runId);

/**
 * Executes one `running` agent run in the background (never throws): dispatches to its agent and
 * marks it failed with the error when the agent throws. Runs never start on their own: only
 * confirm / retry / revise-and-run put a run in `running`.
 */
export const executeAgentRun = (client: CanonicalDataClient, runId: string): void => {
  if (active.has(runId)) return;
  active.add(runId);
  void (async () => {
    try {
      const run = await getAgentRunById(client, runId);
      if (!run || run.status !== 'running') return;
      console.log('🚀 [agent-runs] Executing', { runId, agent: run.agent, version: run.version });
      if (run.agent === 'pr') await runPrAgent(client, run);
      else if (run.agent === 'convention') await runConventionAgent(client, run);
      else await runTemplateAgent(client, run);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ [agent-runs] Run failed', { runId, error: message });
      await updateAgentRun(client, runId, { status: 'failed', error: message, finished_at: new Date().toISOString() }, ['running']).catch(() => null);
    } finally {
      active.delete(runId);
    }
  })();
};

let ticker: NodeJS.Timeout | null = null;

/**
 * Agent worker: on startup and every minute, resumes runs left `running` (e.g. after a restart)
 * and sweeps applied convention changes into template drafts. Never starts drafts.
 */
export const startAgentWorker = (intervalMs = 60_000): void => {
  if (ticker) return;
  const tick = async (): Promise<void> => {
    const client = getManagedCanonicalDataClient();
    if (!client) return;
    try {
      const running = await listAgentRuns(client, { status: 'running', limit: 50 });
      for (const run of running) if (!active.has(run.id)) executeAgentRun(client, run.id);
      await syncTemplateDrafts(client);
    } catch (error) {
      console.warn('⚠️ [agent-runs] Worker tick failed', error instanceof Error ? error.message : error);
    }
  };
  void tick();
  ticker = setInterval(() => void tick(), intervalMs);
  ticker.unref();
  console.log('✅ [agent-runs] Worker started');
};
