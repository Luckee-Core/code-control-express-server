import { getAiExchangeById, listAiExchanges } from '../../data/ai-exchanges';
import { getAgentRunById, listAgentRuns } from '../../data/agent-runs';
import { listConventionChanges } from '../../data/convention-changes';
import { listConventionChangePropagations } from '../../data/convention-change-propagations';
import { getDataModelDeliveryById } from '../../data/data-model-deliveries';
import { listPrAgentEdits } from '../../data/pr-agent-edits';
import { getAllSoftwareSystems } from '../../data/software-systems';
import { listTemplateChanges } from '../../data/template-changes';
import type { AgentKind, AgentRun, AiExchange, ListAgentRunsFilter } from '../../model/agent-run';
import type { DataModelDelivery } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import { loadTemplateCarriedChanges } from './load-template-carried-changes';
import { AgentRequestError } from './agent-request-error';
import { WAITING_STATUSES } from './config';
import { loadConventionCatalog } from './load-role-conventions';
import type { AgentRunDetail, AgentRunListItem, AgentRunSummary } from './types';

const byCreated = (a: AgentRun, b: AgentRun): number => a.created_at.localeCompare(b.created_at);

const loadDeliveries = async (client: CanonicalDataClient, ids: string[]): Promise<Map<string, DataModelDelivery>> => {
  const unique = [...new Set(ids)];
  const rows = await Promise.all(unique.map((id) => getDataModelDeliveryById(client, id)));
  return new Map(rows.filter((row): row is DataModelDelivery => row !== null).map((row) => [row.id, row]));
};

/** Lists agent runs for the tables, with project, PR and template PR details attached. */
export const processListAgentRuns = async (client: CanonicalDataClient, filter: ListAgentRunsFilter): Promise<AgentRunListItem[]> => {
  const runs = await listAgentRuns(client, filter);
  const [systems, deliveries, templateChanges] = await Promise.all([
    getAllSoftwareSystems(client),
    loadDeliveries(client, runs.flatMap((run) => (run.delivery_id ? [run.delivery_id] : []))),
    listTemplateChanges(client, { ids: [...new Set(runs.flatMap((run) => run.template_change_ids ?? []))] }),
  ]);
  const systemNames = new Map(systems.map((system) => [system.id, system.name]));
  const changes = new Map(templateChanges.map((change) => [change.id, change]));
  return runs.map((run) => {
    const delivery = run.delivery_id ? deliveries.get(run.delivery_id) ?? null : null;
    const runChanges = (run.template_change_ids ?? []).flatMap((changeId) => (changes.get(changeId) ? [changes.get(changeId)!] : []));
    return {
      ...run,
      software_system_name: run.software_system_id ? systemNames.get(run.software_system_id) ?? null : null,
      delivery: delivery
        ? { id: delivery.id, repo_full_name: delivery.repo_full_name, pr_number: delivery.pr_number, pr_url: delivery.pr_url, role: delivery.role, kind: delivery.kind, status: delivery.status }
        : null,
      template_changes: runChanges
        .map((change) => ({ id: change.id, pr_number: change.pr_number, pr_url: change.pr_url, status: change.status, repo_full_name: change.repo_full_name }))
        .sort((a, b) => a.repo_full_name.localeCompare(b.repo_full_name)),
    };
  });
};

/** Counts of open runs per agent for the sidebar badges (waiting = draft + needs review). */
export const processGetAgentRunSummary = async (client: CanonicalDataClient): Promise<AgentRunSummary> => {
  const runs = await listAgentRuns(client, { statuses: ['draft', 'running', 'needs_review', 'failed'], limit: 1000 });
  const summary: AgentRunSummary = { pr: { waiting: 0 }, convention: { waiting: 0 }, template: { waiting: 0 } };
  for (const run of runs) {
    const bucket = summary[run.agent as AgentKind];
    bucket[run.status] = (bucket[run.status] ?? 0) + 1;
    if (WAITING_STATUSES.includes(run.status)) bucket.waiting += 1;
  }
  return summary;
};

/** Every version of a run (follows revision links both ways), oldest first. */
const loadVersions = async (client: CanonicalDataClient, run: AgentRun): Promise<AgentRun[]> => {
  const versions = new Map<string, AgentRun>([[run.id, run]]);
  let cursor = run.revision_of_run_id;
  while (cursor && !versions.has(cursor)) {
    const previous = await getAgentRunById(client, cursor);
    if (!previous) break;
    versions.set(previous.id, previous);
    cursor = previous.revision_of_run_id;
  }
  let frontier = [run.id];
  while (frontier.length > 0) {
    const next = (await Promise.all(frontier.map((id) => listAgentRuns(client, { revision_of_run_id: id, limit: 20 })))).flat();
    frontier = next.filter((item) => !versions.has(item.id)).map((item) => item.id);
    for (const item of next) versions.set(item.id, item);
  }
  return [...versions.values()].sort((a, b) => a.version - b.version || byCreated(a, b));
};

/** Full detail for a run's page: lineage, versions, hand-offs, AI calls and agent-specific data. */
export const processGetAgentRunDetail = async (client: CanonicalDataClient, id: string): Promise<AgentRunDetail> => {
  const run = await getAgentRunById(client, id);
  if (!run) throw new AgentRequestError(404, 'Agent run not found');

  const rootId = run.root_run_id;
  const [versions, lineage, exchanges, parent, systems] = await Promise.all([
    loadVersions(client, run),
    rootId ? listAgentRuns(client, { root_run_id: rootId, limit: 500 }) : Promise.resolve([run]),
    listAiExchanges(client, run.id),
    run.parent_run_id ? getAgentRunById(client, run.parent_run_id) : Promise.resolve(null),
    getAllSoftwareSystems(client),
  ]);
  const versionIds = new Set(versions.map((item) => item.id));
  const childLists = await Promise.all([...versionIds].map((versionId) => listAgentRuns(client, { parent_run_id: versionId, limit: 100 })));
  const children = new Map(childLists.flat().map((child) => [child.id, child]));

  const detail: AgentRunDetail = {
    run,
    software_system_name: systems.find((system) => system.id === run.software_system_id)?.name ?? null,
    versions,
    lineage: [...new Map([...lineage, ...versions].map((item) => [item.id, item])).values()].sort(byCreated),
    parent,
    children: [],
    exchanges,
    pr: null,
    convention: null,
    template: null,
  };

  if (run.agent === 'pr') {
    const [delivery, edits] = await Promise.all([
      run.delivery_id ? getDataModelDeliveryById(client, run.delivery_id) : Promise.resolve(null),
      listPrAgentEdits(client, run.id),
    ]);
    detail.pr = { delivery, edits };
  }

  if (run.agent === 'convention') {
    const prRunId = String(run.input.pr_run_id ?? run.parent_run_id ?? '');
    const [prRun, prEdits, changes, catalog] = await Promise.all([
      prRunId ? getAgentRunById(client, prRunId) : Promise.resolve(null),
      prRunId ? listPrAgentEdits(client, prRunId) : Promise.resolve([]),
      listConventionChanges(client, { source_type: 'convention_agent', source_id: run.id, limit: 500 }),
      loadConventionCatalog(client),
    ]);
    const keys = new Set(changes.flatMap((change) => [change.convention_key, change.cited_key ?? '']).filter(Boolean));
    detail.convention = { pr_run: prRun, pr_edits: prEdits, changes, related: catalog.filter((convention) => keys.has(convention.key)) };
    // Template drafts that collected this run's applied changes (they may have another parent).
    const applied = changes.filter((change) => change.status === 'applied').map((change) => change.id);
    if (applied.length > 0) {
      const propagations = await listConventionChangePropagations(client, { convention_change_ids: applied });
      const runIds = [...new Set(propagations.flatMap((row) => (row.run_id ? [row.run_id] : [])))].filter((runId) => !children.has(runId));
      for (const child of await Promise.all(runIds.map((runId) => getAgentRunById(client, runId)))) if (child) children.set(child.id, child);
    }
  }

  if (run.agent === 'template') {
    const [templateChanges, carried] = await Promise.all([
      run.template_change_ids.length > 0 ? listTemplateChanges(client, { ids: run.template_change_ids }) : Promise.resolve([]),
      loadTemplateCarriedChanges(client, run),
    ]);
    const repos = [...new Set([...carried.propagations.map((row) => row.template_repo), ...templateChanges.map((change) => change.repo_full_name)])].sort();
    detail.template = {
      repos,
      template_changes: templateChanges.sort((a, b) => a.repo_full_name.localeCompare(b.repo_full_name)),
      changes: carried.changes,
      propagations: carried.propagations,
    };
  }

  detail.children = [...children.values()].sort(byCreated);
  return detail;
};

/** One AI call with its prompt and response bodies (must belong to the run). */
export const processGetAgentRunExchange = async (client: CanonicalDataClient, runId: string, exchangeId: string): Promise<AiExchange> => {
  const exchange = await getAiExchangeById(client, exchangeId);
  if (!exchange || exchange.run_id !== runId) throw new AgentRequestError(404, 'AI call not found');
  return exchange;
};
