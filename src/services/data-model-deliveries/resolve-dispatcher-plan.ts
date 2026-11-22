import { getAllSoftwareSystems, getSoftwareSystemById, updateSoftwareSystem } from '../../data/software-systems';
import { getSoftwareSystemReposBySoftwareSystemId, insertSoftwareSystemRepo } from '../../data/software-system-repos';
import type { SoftwareSystem } from '../../model/software-system';
import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import { parseTemplateEnv } from '../../utils/github';
import type { CanonicalDataClient } from '../canonical-data-client';
import { allocateDispatcherPorts, buildDispatcherPlan, extractPorts, toKebabCase, type DispatcherPlan, type DispatcherPorts } from '../codegen';
import { getDefaultBranchHead, getFileText, listTreePaths, type GithubRepoRef } from '../github';
import { resolveRoleRepo } from './resolve-role-repos';

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** The shared main gateway repo (MAIN_GATEWAY_REPO=owner/repo), or null when unset. */
export const readMainGatewayRepo = (): GithubRepoRef | null => parseTemplateEnv(process.env.MAIN_GATEWAY_REPO);

/**
 * Tags the main gateway repo on the software system (role gateway) so the dispatcher delivery can
 * open its PR there. One shared repo, linked to every system that delivers a dispatcher.
 */
export const ensureGatewayRepoLinked = async (
  client: CanonicalDataClient,
  system: SoftwareSystem,
  repos: SoftwareSystemRepo[],
): Promise<SoftwareSystemRepo[]> => {
  if (repos.some((repo) => repo.role === 'gateway')) return repos;
  const ref = readMainGatewayRepo();
  if (!ref) return repos;
  console.log('🚀 [dispatcher-plan] Linking main gateway repo', { system: system.id, repo: `${ref.owner}/${ref.repo}` });
  await insertSoftwareSystemRepo(client, {
    customer_id: system.customer_id,
    software_system_id: system.id,
    repo_type: 'express',
    role: 'gateway',
    name: ref.repo,
    repo_url: `https://github.com/${ref.owner}/${ref.repo}`,
    clone_url: `https://github.com/${ref.owner}/${ref.repo}.git`,
  });
  return getSoftwareSystemReposBySoftwareSystemId(client, system.id);
};

const savedPorts = (system: SoftwareSystem): DispatcherPorts | null =>
  system.dispatcher_port && system.dispatcher_storage_port && system.dispatcher_api_port && system.dispatcher_web_port
    ? { dispatcher: system.dispatcher_port, storage: system.dispatcher_storage_port, api: system.dispatcher_api_port, web: system.dispatcher_web_port }
    : null;

let gatewayPortsCache: { at: number; ports: number[] } | null = null;
const GATEWAY_PORTS_TTL_MS = 5 * 60 * 1000;

/** Every port number mentioned in the main gateway repo's migrations (other projects' dispatchers, webs, storage). */
const readGatewayMigrationPorts = async (): Promise<number[]> => {
  if (gatewayPortsCache && Date.now() - gatewayPortsCache.at < GATEWAY_PORTS_TTL_MS) return gatewayPortsCache.ports;
  const ref = readMainGatewayRepo();
  if (!ref) return [];
  try {
    const head = await getDefaultBranchHead(ref);
    if (!head.ok || !head.head_sha) return [];
    const paths = [...(await listTreePaths(ref, head.head_sha))].filter((path) => /^migrations\/[^/]+\.sql$/.test(path));
    const texts = await Promise.all(paths.map((path) => getFileText(ref, path, head.head_sha!)));
    const ports = texts.flatMap((text) => (text ? extractPorts(text) : []));
    gatewayPortsCache = { at: Date.now(), ports };
    return ports;
  } catch (error) {
    console.warn('⚠️ [dispatcher-plan] Could not read main gateway ports', { error: errorMessage(error) });
    return [];
  }
};

/**
 * The dispatcher plan for a software system: saved ports (or the next free block, skipping ports
 * other systems hold and ports in the main gateway's migrations), its repo names and spawn folders.
 */
export const resolveDispatcherPlan = async (client: CanonicalDataClient, softwareSystemId: string): Promise<DispatcherPlan> => {
  const system = await getSoftwareSystemById(client, softwareSystemId);
  if (!system) throw new Error('Software system not found');
  const repos = await getSoftwareSystemReposBySoftwareSystemId(client, softwareSystemId);
  const saved = savedPorts(system);
  let ports = saved;
  if (!ports) {
    const [systems, gatewayPorts] = await Promise.all([getAllSoftwareSystems(client), readGatewayMigrationPorts()]);
    const used = new Set<number>(gatewayPorts);
    for (const other of systems) {
      if (other.id === system.id) continue;
      for (const port of [other.dispatcher_port, other.dispatcher_storage_port, other.dispatcher_api_port, other.dispatcher_web_port]) {
        if (port) used.add(port);
      }
    }
    ports = allocateDispatcherPorts(used);
  }
  const name = system.name.trim() || 'App';
  const repoName = (role: Parameters<typeof resolveRoleRepo>[1]): string | null => resolveRoleRepo(repos, role)?.name ?? null;
  return buildDispatcherPlan({
    slug: toKebabCase(name.replace(/[^A-Za-z0-9\s_-]/g, ' ')) || 'app',
    name,
    description: system.description,
    repos: {
      storage: repoName('storage'),
      express: repoName('express'),
      dispatcher: repoName('dispatcher'),
      dispatcher_web: repoName('dispatcher-web'),
    },
    ports,
    portsSaved: Boolean(saved),
    studioReposRoot: process.env.STUDIO_REPOS_ROOT ?? null,
  });
};

/** Stores the plan's ports on the software system the first time a dispatcher is delivered. */
export const saveDispatcherPorts = async (client: CanonicalDataClient, softwareSystemId: string, plan: DispatcherPlan): Promise<void> => {
  if (plan.ports_saved) return;
  await updateSoftwareSystem(client, softwareSystemId, {
    dispatcher_port: plan.ports.dispatcher,
    dispatcher_storage_port: plan.ports.storage,
    dispatcher_api_port: plan.ports.api,
    dispatcher_web_port: plan.ports.web,
  });
  plan.ports_saved = true;
  console.log('✅ [dispatcher-plan] Saved ports', { system: softwareSystemId, ports: plan.ports });
};
