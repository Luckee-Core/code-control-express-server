import { createAgentRun, listAgentRuns, updateAgentRun } from '../../data/agent-runs';
import { listUnpropagatedConventionChanges } from '../../data/convention-changes';
import { insertConventionChangePropagations, listConventionChangePropagations } from '../../data/convention-change-propagations';
import type { AgentRun, InsertConventionChangePropagationInput } from '../../model/agent-run';
import type { CanonicalDataClient } from '../canonical-data-client';
import { listTemplateRepos } from '../codegen';

type TemplateTarget = { role_key: string; full_name: string };

const findDraft = async (client: CanonicalDataClient): Promise<AgentRun | null> =>
  (await listAgentRuns(client, { agent: 'template', status: 'draft', limit: 1 }))[0] ?? null;

/**
 * The open (draft) template run, or a new one. A single draft collects changes for every template
 * repo; confirming it opens one PR per affected repo.
 */
const findOrCreateTemplateDraft = async (client: CanonicalDataClient, parentRun: AgentRun | null): Promise<AgentRun> => {
  const existing = await findDraft(client);
  if (existing) return existing;
  try {
    return await createAgentRun(client, {
      agent: 'template',
      parent_run_id: parentRun?.id ?? null,
      root_run_id: parentRun ? parentRun.root_run_id ?? parentRun.id : null,
      software_system_id: parentRun?.software_system_id ?? null,
      delivery_id: parentRun?.delivery_id ?? null,
      title: 'Template update',
      input: { change_ids: [] },
    });
  } catch (error) {
    // Another request created it first (one draft at a time): use that one.
    const raced = await findDraft(client);
    if (raced) return raced;
    throw error;
  }
};

/**
 * Propagation sweep: every applied, not-yet-propagated convention change gets one propagation row
 * per template repo of its roles (no roles = every template repo), all attached to the template draft
 * (created when none is open). Changes whose roles have no template repo are recorded as not_needed
 * so they aren't swept again. Returns the draft when it received changes (as a list, for hand-offs).
 */
export const syncTemplateDrafts = async (client: CanonicalDataClient, options: { parentRun?: AgentRun | null } = {}): Promise<AgentRun[]> => {
  const changes = await listUnpropagatedConventionChanges(client);
  if (changes.length === 0) return [];
  const repos = await listTemplateRepos(client);
  const byRole = new Map(repos.map((repo) => [repo.role_key, repo]));
  let draft: AgentRun | null = null;
  const rows: InsertConventionChangePropagationInput[] = [];

  for (const change of changes) {
    const roles = new Set(change.role_keys);
    if (change.change_type === 'role_change') {
      for (const role of ((change.before as { role_keys?: string[] } | null)?.role_keys ?? [])) roles.add(role);
    }
    const candidates: TemplateTarget[] = roles.size === 0 ? repos : [...roles].flatMap((role) => (byRole.get(role) ? [byRole.get(role)!] : []));
    const targets = [...new Map(candidates.map((target) => [target.full_name, target])).values()];
    if (targets.length === 0) {
      rows.push({
        convention_change_id: change.id,
        template_repo: '(none)',
        role_key: [...roles].join(',') || 'none',
        status: 'not_needed',
        reason: `No template repo is configured for ${[...roles].join(', ') || 'these roles'}`,
      });
      continue;
    }
    draft ??= await findOrCreateTemplateDraft(client, options.parentRun ?? null);
    for (const target of targets) {
      rows.push({ convention_change_id: change.id, template_repo: target.full_name, role_key: target.role_key, status: 'pending', run_id: draft.id });
    }
  }

  await insertConventionChangePropagations(client, rows);
  if (!draft) return [];
  const pending = await listConventionChangePropagations(client, { run_id: draft.id, status: 'pending' });
  const changeIds = [...new Set(pending.map((row) => row.convention_change_id))];
  const updated = (await updateAgentRun(client, draft.id, { input: { ...draft.input, change_ids: changeIds } })) ?? draft;
  console.log('🧩 [agent-runs] Template draft updated', { runId: updated.id, changes: changeIds.length, repos: [...new Set(pending.map((row) => row.template_repo))] });
  return [updated];
};

let scheduled: NodeJS.Timeout | null = null;

/**
 * Schedules a propagation sweep shortly after a manual convention edit (several quick edits share
 * one sweep). Errors are logged, never thrown into the edit request.
 */
export const scheduleTemplateSync = (client: CanonicalDataClient, delayMs = 2000): void => {
  if (scheduled) clearTimeout(scheduled);
  scheduled = setTimeout(() => {
    scheduled = null;
    syncTemplateDrafts(client).catch((error) =>
      console.error('❌ [agent-runs] Template sync failed', error instanceof Error ? error.message : error),
    );
  }, delayMs);
};
