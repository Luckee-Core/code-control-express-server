import type { OpsTicket } from '../../model/ops-ticket';
import { invokeOpsOrThrow } from './invoke-ops-or-throw';

type OpsInternalProject = { id: string; name: string; repos: string[] };
type OpsProjectRepo = { github_owner: string; github_repo: string };
type OpsProject = { id: string; name: string };

/**
 * The ops ticket's project name and repo names (owner/repo), from its internal project
 * (Code Commits repos + linked project_repos), a tracking project's internal project, or its
 * customer project's project_repos. Used to find the Code Control software system.
 */
export const getOpsTicketRepoNames = async (
  ticket: OpsTicket,
): Promise<{ projectName: string | null; repoNames: string[] }> => {
  let internal: OpsInternalProject | null = null;
  if (ticket.internal_project_id) {
    internal = await invokeOpsOrThrow<OpsInternalProject | null>('getInternalProjectById', [ticket.internal_project_id]);
  } else if (ticket.project_id) {
    internal = await invokeOpsOrThrow<OpsInternalProject | null>('getInternalProjectByTrackingProjectId', [ticket.project_id]);
  }
  if (internal) {
    const linked = await invokeOpsOrThrow<OpsProjectRepo[]>('getProjectReposByInternalProjectId', [internal.id]);
    return {
      projectName: internal.name,
      repoNames: [...internal.repos, ...linked.map((repo) => `${repo.github_owner}/${repo.github_repo}`)],
    };
  }
  if (ticket.project_id) {
    const [project, repos] = await Promise.all([
      invokeOpsOrThrow<OpsProject | null>('getProjectById', [ticket.project_id]),
      invokeOpsOrThrow<OpsProjectRepo[]>('getProjectReposByProjectId', [ticket.project_id]),
    ]);
    return { projectName: project?.name ?? null, repoNames: repos.map((repo) => `${repo.github_owner}/${repo.github_repo}`) };
  }
  return { projectName: null, repoNames: [] };
};
