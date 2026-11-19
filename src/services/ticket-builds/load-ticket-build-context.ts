import { listRepoRoles } from '../../data/repo-roles';
import { getSoftwareSystemById } from '../../data/software-systems';
import type { TicketBuild } from '../../model/ticket-build';
import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import { parseGithubRepoUrl } from '../../utils/parse-github-repo-url';
import type { CanonicalDataClient } from '../canonical-data-client';
import { getDefaultBranchHead, getFileText, listTreePaths } from '../github';
import { getOpsLatestTicketResearch } from '../ops-tracker-client';
import { KEY_DOC_PATHS, MAX_DOC_CHARS, MAX_TREE_PATHS, TREE_SKIP_PATTERN } from './config';
import { loadRoleConventionsText } from './load-role-conventions-text';
import type { TicketBuildContext, TicketBuildRepoContext } from './types';

const cap = (value: string, max: number): string => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

const loadRepo = async (
  client: CanonicalDataClient,
  repo: TicketBuildRepo,
  roles: Map<string, { name: string; description: string }>,
): Promise<TicketBuildRepoContext> => {
  const role = roles.get(repo.role);
  const base: TicketBuildRepoContext = {
    repo,
    roleName: role?.name ?? repo.role,
    roleDescription: role?.description ?? '',
    tree: [],
    treeTruncated: false,
    docs: [],
    conventionsText: '',
    readError: null,
  };
  try {
    base.conventionsText = await loadRoleConventionsText(client, repo.role);
  } catch (error) {
    console.warn('⚠️ [ticket-builds] Conventions unavailable', { role: repo.role, error: error instanceof Error ? error.message : error });
  }
  const parsed = parseGithubRepoUrl(repo.repo_url);
  if (!parsed.success) return { ...base, readError: parsed.error };
  const ref = { owner: parsed.owner, repo: parsed.repo };
  try {
    const head = await getDefaultBranchHead(ref);
    if (!head.ok) return { ...base, readError: head.error };
    if (!head.head_sha) return { ...base, readError: 'Repository has no commits yet' };
    const paths = [...(await listTreePaths(ref, head.head_sha))].filter((path) => !TREE_SKIP_PATTERN.test(path)).sort();
    const docs: { path: string; text: string }[] = [];
    for (const path of KEY_DOC_PATHS) {
      const text = await getFileText(ref, path, head.head_sha);
      if (text) docs.push({ path, text: cap(text, MAX_DOC_CHARS) });
    }
    return {
      ...base,
      tree: paths.slice(0, MAX_TREE_PATHS),
      treeTruncated: paths.length > MAX_TREE_PATHS,
      docs,
    };
  } catch (error) {
    return { ...base, readError: error instanceof Error ? error.message : 'Could not read repository' };
  }
};

/**
 * Everything the plan step needs: ops research (optional), and per repo its role, file tree,
 * key docs and role conventions. A repo that can't be read still gets a context with readError.
 */
export const loadTicketBuildContext = async (
  client: CanonicalDataClient,
  build: TicketBuild,
  repos: TicketBuildRepo[],
): Promise<TicketBuildContext> => {
  const [system, roleRows, research] = await Promise.all([
    getSoftwareSystemById(client, build.software_system_id),
    listRepoRoles(client),
    getOpsLatestTicketResearch(build.ops_ticket_id),
  ]);
  const roles = new Map(roleRows.map((role) => [role.key, { name: role.name, description: role.description }]));
  const contexts: TicketBuildRepoContext[] = [];
  for (const repo of repos.filter((row) => row.included)) {
    contexts.push(await loadRepo(client, repo, roles));
  }
  return { build, systemName: system?.name ?? 'Unknown system', research, repos: contexts };
};
