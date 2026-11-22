/**
 * The project dispatcher plan: every id, port, repo name, spawn folder, secret env name and
 * exposed endpoint the `dispatcher` kind renders (express template ADRs 011-014, nextjs ADR 022).
 * Pure data logic; the code shape lives in the template repos.
 */

export type DispatcherPorts = { dispatcher: number; storage: number; api: number; web: number };

export type DispatcherEndpoint = {
  id: string;
  service_id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  requires_body: boolean;
  sort_order: number;
};

export type DispatcherPlan = {
  /** Gateway catalog project id: the software system slug. */
  project_id: string;
  name: string;
  description: string;
  /** Upper snake prefix for paired secret env names (my-project -> MY_PROJECT). */
  env_prefix: string;
  /** project_id with - -> _ (main gateway session tables). */
  session_slug: string;
  ports: DispatcherPorts;
  /** True when the ports come from the software system (assigned by an earlier delivery). */
  ports_saved: boolean;
  service_ids: { storage: string; api: string; gateway: string };
  repos: { storage: string; express: string; dispatcher: string; dispatcher_web: string };
  /** {STUDIO_REPOS_ROOT}/{project}; also the dispatcher's DISPATCHER_SPAWN_ROOTS. */
  spawn_root: string;
  cwd: { storage: string; express: string; dispatcher: string; dispatcher_web: string };
  gateway_path_prefix: string;
  api_path_prefix: string;
  secrets: { main_gate: string; main_admin: string; storage: string };
  endpoints: DispatcherEndpoint[];
  /** What blocks delivery (missing repos, STUDIO_REPOS_ROOT unset); empty when ready. */
  problems: string[];
};

/** First port Code Control assigns; existing studio projects sit below it. */
export const DISPATCHER_PORT_BASE = 3200;

/**
 * Lowest block of four consecutive ports at or above 3200 (aligned to 4) with none of them in use:
 * dispatcher, storage, API, dispatcher web.
 */
export const allocateDispatcherPorts = (used: Set<number>): DispatcherPorts => {
  for (let base = DISPATCHER_PORT_BASE; base + 3 <= 65535; base += 4) {
    if ([0, 1, 2, 3].every((offset) => !used.has(base + offset))) {
      return { dispatcher: base, storage: base + 1, api: base + 2, web: base + 3 };
    }
  }
  throw new Error('No free block of four ports above 3200');
};

/** Every port-looking number (3000-65535) in a text, e.g. a main gateway migration. */
export const extractPorts = (text: string): number[] => {
  const ports: number[] = [];
  for (const match of text.matchAll(/(?<![\d.])(\d{4,5})(?![\d.])/g)) {
    const port = Number(match[1]);
    if (port >= 3000 && port <= 65535) ports.push(port);
  }
  return ports;
};

/** The default storage trio every project exposes (express template ADR 012). */
export const defaultDispatcherEndpoints = (projectId: string, storageServiceId: string): DispatcherEndpoint[] => [
  { id: `${projectId}-storage-health`, service_id: storageServiceId, method: 'GET', path: '/api/storage/health', summary: 'Storage liveness', requires_body: false, sort_order: 10 },
  { id: `${projectId}-storage-meta`, service_id: storageServiceId, method: 'GET', path: '/api/storage/meta', summary: 'Table counts (storage secret)', requires_body: false, sort_order: 20 },
  { id: `${projectId}-storage-v1-invoke`, service_id: storageServiceId, method: 'POST', path: '/api/storage/v1/invoke', summary: 'Storage operation invoke', requires_body: true, sort_order: 30 },
];

/**
 * Builds the plan from the software system's slug, name, repo names, ports and the studio repos root.
 */
export const buildDispatcherPlan = (input: {
  slug: string;
  name: string;
  description: string | null;
  repos: { storage: string | null; express: string | null; dispatcher: string | null; dispatcher_web: string | null };
  ports: DispatcherPorts;
  portsSaved: boolean;
  studioReposRoot: string | null;
}): DispatcherPlan => {
  const projectId = input.slug;
  const envPrefix = projectId.replace(/-/g, '_').toUpperCase();
  const problems: string[] = [];
  const repos = {
    storage: input.repos.storage ?? `${projectId}-storage-express-server`,
    express: input.repos.express ?? `${projectId}-express-server`,
    dispatcher: input.repos.dispatcher ?? `${projectId}-express-dispatcher-server`,
    dispatcher_web: input.repos.dispatcher_web ?? `${projectId}-dispatcher-web`,
  };
  const labels: Record<keyof typeof repos, string> = {
    storage: 'Storage Express',
    express: 'API Express',
    dispatcher: 'Dispatcher Express',
    dispatcher_web: 'Dispatcher Web',
  };
  for (const key of Object.keys(repos) as Array<keyof typeof repos>) {
    if (!input.repos[key]) problems.push(`No ${labels[key]} repo yet (Repositories tab); its name below is the default.`);
  }
  const root = input.studioReposRoot?.trim().replace(/\/+$/, '') || null;
  if (!root) problems.push('Set STUDIO_REPOS_ROOT in the Code Control express .env (the folder holding each project\'s repos on the studio, e.g. /Users/you/luckee).');
  const spawnRoot = `${root ?? '$STUDIO_REPOS_ROOT'}/${projectId}`;
  const storageServiceId = `${projectId}-storage`;
  return {
    project_id: projectId,
    name: input.name,
    description: input.description?.trim() || `${input.name} project dispatcher`,
    env_prefix: envPrefix,
    session_slug: projectId.replace(/-/g, '_'),
    ports: input.ports,
    ports_saved: input.portsSaved,
    service_ids: { storage: storageServiceId, api: `${projectId}-api`, gateway: `${projectId}-dispatcher` },
    repos,
    spawn_root: spawnRoot,
    cwd: {
      storage: `${spawnRoot}/${repos.storage}`,
      express: `${spawnRoot}/${repos.express}`,
      dispatcher: `${spawnRoot}/${repos.dispatcher}`,
      dispatcher_web: `${spawnRoot}/${repos.dispatcher_web}`,
    },
    gateway_path_prefix: `/api/${projectId}`,
    api_path_prefix: '/api/data',
    secrets: {
      main_gate: `${envPrefix}_DISPATCHER_GATE_SECRET`,
      main_admin: `${envPrefix}_DISPATCHER_ADMIN_SECRET`,
      storage: `${envPrefix}_STORAGE_DISPATCHER_SECRET`,
    },
    endpoints: defaultDispatcherEndpoints(projectId, storageServiceId),
    problems,
  };
};
