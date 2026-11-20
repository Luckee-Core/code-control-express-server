import { updateAgentRun } from '../../data/agent-runs';
import { closeProposedConventionChanges, listConventionChanges, updateProposedConventionChange } from '../../data/convention-changes';
import type { AgentRun } from '../../model/agent-run';
import type { ConventionChange } from '../../model/convention-change';
import { AgentRequestError } from '../agent-runs/agent-request-error';
import { syncTemplateDrafts } from '../agent-runs/sync-template-drafts';
import type { CanonicalDataClient } from '../canonical-data-client';
import { applyConventionChange } from './apply-convention-change';
import { loadCatalog } from './convention-catalog';
import { validateConventionChange } from './validate-convention-change';

/** One reviewer decision on a proposed change. */
export type ConventionDecision = {
  change_id: string;
  action: 'accept' | 'reject';
  /** Edited `after` (accept only). */
  after?: Record<string, unknown>;
  reason?: string;
};

/**
 * Applies the reviewer's decisions: edits then validates the accepted proposals against today's
 * catalog, applies them (creates first) and rejects the rest. Then hands off to the template agent:
 * every affected template repo gets (or joins) a template draft.
 */
export const approveConventionAgentRun = async (
  client: CanonicalDataClient,
  run: AgentRun,
  input: { decisions: ConventionDecision[]; note: string },
): Promise<{ run: AgentRun; next: AgentRun[] }> => {
  const proposed = await listConventionChanges(client, { source_type: 'convention_agent', source_id: run.id, status: 'proposed' });
  if (proposed.length === 0) throw new AgentRequestError(409, 'This run has no pending proposals');
  const decisions = new Map(input.decisions.map((decision) => [decision.change_id, decision]));
  const undecided = proposed.filter((row) => !decisions.has(row.id));
  if (undecided.length > 0) throw new AgentRequestError(400, `Decide every proposal (missing: ${undecided.map((row) => row.convention_key).join(', ')})`);

  const accepted: ConventionChange[] = [];
  for (const row of proposed) {
    const decision = decisions.get(row.id)!;
    if (decision.action !== 'accept') continue;
    if (decision.after || decision.reason) {
      const edited = await updateProposedConventionChange(client, row.id, {
        ...(decision.after ? { after: decision.after } : {}),
        ...(decision.reason ? { reason: decision.reason } : {}),
      });
      if (!edited) throw new AgentRequestError(409, `${row.convention_key} is no longer pending`);
      accepted.push(edited);
    } else {
      accepted.push(row);
    }
  }

  const catalog = await loadCatalog(client);
  const createKeys = new Set<string>();
  const errors = accepted.flatMap((row) => {
    const rowErrors = validateConventionChange(row, catalog, createKeys);
    if (row.change_type === 'create') createKeys.add(row.convention_key);
    return rowErrors;
  });
  if (errors.length > 0) throw new AgentRequestError(400, `Fix these before approving:\n${errors.join('\n')}`);

  const ordered = [...accepted].sort((a, b) => Number(b.change_type === 'create') - Number(a.change_type === 'create'));
  const applied: string[] = [];
  for (const row of ordered) {
    try {
      await applyConventionChange(client, row);
      applied.push(row.convention_key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new AgentRequestError(
        409,
        `Applying ${row.convention_key} failed: ${message}.${applied.length > 0 ? ` Already applied: ${applied.join(', ')}. Approve again to finish the rest.` : ''}`,
      );
    }
  }
  const rejectedIds = proposed.filter((row) => decisions.get(row.id)?.action === 'reject').map((row) => row.id);
  if (rejectedIds.length > 0) await closeProposedConventionChanges(client, { status: 'rejected', ids: rejectedIds, reason: input.note });

  const decided = await updateAgentRun(
    client,
    run.id,
    {
      status: applied.length > 0 ? 'approved' : 'rejected',
      decision_note: input.note,
      decided_at: new Date().toISOString(),
      output: { ...run.output, applied_count: applied.length, rejected_count: rejectedIds.length },
    },
    ['needs_review'],
  );
  if (!decided) throw new AgentRequestError(409, 'This run is no longer waiting for review');

  const next = applied.length > 0 ? await syncTemplateDrafts(client, { parentRun: decided }) : [];
  console.log('✅ [convention-agent] Decisions applied', { runId: run.id, applied: applied.length, rejected: rejectedIds.length, templateDrafts: next.length });
  return { run: decided, next };
};
