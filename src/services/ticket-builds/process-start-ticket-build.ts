import { listTicketBuildReposByBuildId, updateTicketBuildRepo } from '../../data/ticket-build-repos';
import { getTicketBuildById, updateTicketBuild } from '../../data/ticket-builds';
import type { TicketBuild } from '../../model/ticket-build';
import type { CanonicalDataClient } from '../canonical-data-client';
import { readCursorApiKey, startCursorAgent } from '../cursor-agents';
import { buildRepoAgentPrompt } from './build-repo-agent-prompt';
import { finalizeTicketBuild } from './finalize-ticket-build';
import { loadRoleConventionsText } from './load-role-conventions-text';
import { TicketBuildRequestError } from './ticket-build-request-error';

/**
 * Approves the plan and starts one Cursor Cloud agent per included repo (in parallel; they share the
 * contract). Each repo row records its agent ids, or the start error.
 */
export const processStartTicketBuild = async (client: CanonicalDataClient, id: string): Promise<TicketBuild> => {
  if (!readCursorApiKey()) throw new TicketBuildRequestError(503, 'CURSOR_API_KEY is not set on the Express server');
  const build = await getTicketBuildById(client, id);
  if (!build) throw new TicketBuildRequestError(404, 'Ticket build not found');
  if (build.status !== 'plan_ready') throw new TicketBuildRequestError(409, 'Only a plan waiting for review can be built');
  const repos = await listTicketBuildReposByBuildId(client, id);
  const included = repos.filter((repo) => repo.included && repo.plan_text.trim());
  if (included.length === 0) throw new TicketBuildRequestError(400, 'Include at least one repository with a plan');

  const started = (await updateTicketBuild(client, id, { status: 'building', approved_at: new Date().toISOString(), error: null })) ?? build;
  const conventionsByRole = new Map<string, string>();
  for (const role of new Set(included.map((repo) => repo.role))) {
    conventionsByRole.set(role, await loadRoleConventionsText(client, role).catch(() => ''));
  }

  const rows = await Promise.all(
    included.map(async (repo) => {
      const prompt = buildRepoAgentPrompt({ build: started, repo, siblings: repos, conventionsText: conventionsByRole.get(repo.role) ?? '' });
      const result = await startCursorAgent({ repoUrl: repo.repo_url, prompt });
      const now = new Date().toISOString();
      return result.success
        ? ((await updateTicketBuildRepo(client, repo.id, {
            status: 'running',
            cursor_agent_id: result.agentId,
            cursor_run_id: result.runId,
            error: null,
            started_at: now,
          })) ?? repo)
        : ((await updateTicketBuildRepo(client, repo.id, { status: 'failed', error: result.error, started_at: now, finished_at: now })) ?? repo);
    }),
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  console.log('🚀 [ticket-builds] Agents started', { build: id, started: rows.filter((row) => row.status === 'running').length });
  return finalizeTicketBuild(client, started, repos.map((repo) => byId.get(repo.id) ?? repo));
};
