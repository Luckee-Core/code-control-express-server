import { getAllSoftwareSystemRepos, getSoftwareSystemReposBySoftwareSystemId } from '../../data/software-system-repos';
import { getAllSoftwareSystems, getSoftwareSystemById } from '../../data/software-systems';
import { createTicketBuildRepos, updateTicketBuildRepo } from '../../data/ticket-build-repos';
import { createTicketBuild, getActiveTicketBuildByOpsTicketId } from '../../data/ticket-builds';
import type { SoftwareSystem } from '../../model/software-system';
import type { TicketBuild } from '../../model/ticket-build';
import { parseGithubRepoUrl } from '../../utils/parse-github-repo-url';
import { getManagedAnthropicClient, getModelConfig } from '../ai';
import type { CanonicalDataClient } from '../canonical-data-client';
import { getOpsTicket, getOpsTicketRepoNames } from '../ops-tracker-client';
import { DEFAULT_EXCLUDED_ROLES, ROLE_ORDER, TICKET_BUILD_PROMPT_TYPE } from './config';
import { resolveTicketBuildRole } from './resolve-ticket-build-role';
import { resolveTicketBuildSystem } from './resolve-ticket-build-system';
import { startTicketBuildPlan } from './run-ticket-build-plan';
import { TicketBuildRequestError } from './ticket-build-request-error';

const findSystem = async (
  client: CanonicalDataClient,
  repoNames: string[],
  projectName: string | null,
): Promise<SoftwareSystem | null> => {
  const [systems, repos] = await Promise.all([getAllSoftwareSystems(client), getAllSoftwareSystemRepos(client)]);
  return resolveTicketBuildSystem({ repoNames, projectName, systems, repos });
};

/**
 * Creates a build for an ops ticket (or returns its active one): reads the ticket through the gateway,
 * finds the software system (given, or matched by repo name), creates one repo row per system repo
 * in role order, and starts planning in the background.
 */
export const processCreateTicketBuild = async (
  client: CanonicalDataClient,
  input: { opsTicketId: string; softwareSystemId: string | null },
): Promise<TicketBuild> => {
  const anthropic = getManagedAnthropicClient();
  if (!anthropic) throw new TicketBuildRequestError(503, 'ANTHROPIC_API_KEY is not set on the Express server');

  const active = await getActiveTicketBuildByOpsTicketId(client, input.opsTicketId);
  if (active) return active;

  const ticket = await getOpsTicket(input.opsTicketId);
  if (!ticket) throw new TicketBuildRequestError(404, 'My Ops Tracker ticket not found');

  let system: SoftwareSystem | null;
  if (input.softwareSystemId) {
    system = await getSoftwareSystemById(client, input.softwareSystemId);
    if (!system) throw new TicketBuildRequestError(404, 'Software system not found');
  } else {
    const { projectName, repoNames } = await getOpsTicketRepoNames(ticket);
    system = await findSystem(client, repoNames, projectName);
    if (!system) {
      throw new TicketBuildRequestError(400, "No Code Control software system shares this ticket's project repos; choose one");
    }
  }

  const systemRepos = await getSoftwareSystemReposBySoftwareSystemId(client, system.id);
  if (systemRepos.length === 0) throw new TicketBuildRequestError(400, `${system.name} has no repositories in Code Control`);

  const build = await createTicketBuild(client, {
    software_system_id: system.id,
    ops_ticket_id: ticket.id,
    ops_ticket_title: ticket.title,
    ops_ticket_description: ticket.description,
    model: getModelConfig(TICKET_BUILD_PROMPT_TYPE).model,
  });

  const ordered = systemRepos
    .map((repo) => ({ repo, role: resolveTicketBuildRole(repo) }))
    .sort((a, b) => {
      const rank = (role: string) => (ROLE_ORDER.indexOf(role) === -1 ? ROLE_ORDER.length : ROLE_ORDER.indexOf(role));
      return rank(a.role) - rank(b.role) || a.repo.name.localeCompare(b.repo.name);
    });
  const rows = await createTicketBuildRepos(
    client,
    ordered.map(({ repo, role }, position) => {
      const parsed = parseGithubRepoUrl(repo.repo_url);
      return {
        ticket_build_id: build.id,
        software_system_repo_id: repo.id,
        role,
        repo_full_name: parsed.success ? `${parsed.owner}/${parsed.repo}` : repo.name,
        repo_url: repo.repo_url,
        position,
      };
    }),
  );
  for (const row of rows.filter((row) => DEFAULT_EXCLUDED_ROLES.includes(row.role))) {
    await updateTicketBuildRepo(client, row.id, { included: false, status: 'skipped', plan_text: 'Excluded by default (rarely changes for a feature ticket).' });
  }

  console.log('🚀 [ticket-builds] Build created', { build: build.id, system: system.name, repos: rows.length });
  startTicketBuildPlan(client, anthropic, { build, purpose: 'plan', revise: null });
  return build;
};
