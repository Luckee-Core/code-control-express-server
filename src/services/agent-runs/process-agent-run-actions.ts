import { createAgentRun, getAgentRunById, updateAgentRun } from '../../data/agent-runs';
import { closeProposedConventionChanges } from '../../data/convention-changes';
import { listConventionChangePropagations, updateConventionChangePropagations } from '../../data/convention-change-propagations';
import { getDataModelDeliveryById } from '../../data/data-model-deliveries';
import type { AgentRun } from '../../model/agent-run';
import type { CanonicalDataClient } from '../canonical-data-client';
import { approveConventionAgentRun, type ConventionDecision } from '../convention-agent/approve-convention-agent-run';
import { approvePrAgentRun } from '../pr-agent/approve-pr-agent-run';
import { approveTemplateAgentRun } from '../template-agent/approve-template-agent-run';
import { rejectTemplateAgentRun } from '../template-agent/reject-template-agent-run';
import { AgentRequestError } from './agent-request-error';
import { requireAnthropic } from './call-agent-ai';
import { titleFrom } from './config';
import { executeAgentRun } from './execute-agent-run';

const now = (): string => new Date().toISOString();

const requireRun = async (client: CanonicalDataClient, id: string): Promise<AgentRun> => {
  const run = await getAgentRunById(client, id);
  if (!run) throw new AgentRequestError(404, 'Agent run not found');
  return run;
};

const requireStatus = (run: AgentRun, statuses: AgentRun['status'][], action: string): void => {
  if (!statuses.includes(run.status)) throw new AgentRequestError(409, `Can't ${action} a run that is ${run.status.replace('_', ' ')}`);
};

/** Starts a draft: draft → running, then executes in the background. */
const start = async (client: CanonicalDataClient, run: AgentRun, extra: { instructions?: string } = {}): Promise<AgentRun> => {
  requireAnthropic();
  const started = await updateAgentRun(
    client,
    run.id,
    { status: 'running', confirmed_at: now(), started_at: now(), error: null, ...(extra.instructions !== undefined ? { instructions: extra.instructions } : {}) },
    ['draft'],
  );
  if (!started) throw new AgentRequestError(409, 'This run already started');
  executeAgentRun(client, started.id);
  return started;
};

/**
 * Update PR: creates a PR agent run for a delivery as a draft (or starts it right away).
 */
export const processCreatePrAgentRun = async (
  client: CanonicalDataClient,
  input: { deliveryId: string; feedback: string; focusPaths: string[]; runNow: boolean },
): Promise<AgentRun> => {
  const feedback = input.feedback.trim();
  if (!feedback) throw new AgentRequestError(400, 'Feedback is required');
  const delivery = await getDataModelDeliveryById(client, input.deliveryId);
  if (!delivery) throw new AgentRequestError(404, 'Delivery not found');
  if (!delivery.pr_number) throw new AgentRequestError(409, 'This delivery has no PR yet');
  const run = await createAgentRun(client, {
    agent: 'pr',
    software_system_id: delivery.software_system_id,
    delivery_id: delivery.id,
    role_key: delivery.role,
    title: titleFrom(feedback),
    input: { feedback, focus_paths: input.focusPaths },
  });
  const rooted = (await updateAgentRun(client, run.id, { root_run_id: run.id })) ?? run;
  return input.runNow ? start(client, rooted) : rooted;
};

/** Edits a draft before it starts (PR feedback / focus files, instructions). */
export const processUpdateDraftAgentRun = async (
  client: CanonicalDataClient,
  id: string,
  input: { instructions?: string; feedback?: string; focusPaths?: string[] },
): Promise<AgentRun> => {
  const run = await requireRun(client, id);
  requireStatus(run, ['draft'], 'edit');
  const nextInput = { ...run.input };
  if (run.agent === 'pr' && input.feedback !== undefined) nextInput.feedback = input.feedback.trim();
  if (run.agent === 'pr' && input.focusPaths !== undefined) nextInput.focus_paths = input.focusPaths;
  const updated = await updateAgentRun(
    client,
    id,
    { input: nextInput, ...(input.instructions !== undefined ? { instructions: input.instructions } : {}), ...(run.agent === 'pr' && input.feedback ? { title: titleFrom(input.feedback) } : {}) },
    ['draft'],
  );
  if (!updated) throw new AgentRequestError(409, 'This run already started');
  return updated;
};

/**
 * Confirm: starts a draft. Template drafts can narrow the changes they carry (scope); left-out
 * changes are marked skipped in every repo.
 */
export const processConfirmAgentRun = async (
  client: CanonicalDataClient,
  id: string,
  input: { instructions?: string; scopeChangeIds?: string[] },
): Promise<AgentRun> => {
  const run = await requireRun(client, id);
  requireStatus(run, ['draft'], 'confirm');
  if (run.agent === 'pr' && !String(run.input.feedback ?? '').trim()) throw new AgentRequestError(400, 'Add feedback before running');
  if (run.agent === 'template') {
    const pending = await listConventionChangePropagations(client, { run_id: run.id, status: 'pending' });
    if (pending.length === 0) throw new AgentRequestError(409, 'This template draft carries no convention changes');
    if (input.scopeChangeIds) {
      const keep = new Set(input.scopeChangeIds);
      const skipped = pending.filter((row) => !keep.has(row.convention_change_id)).map((row) => row.id);
      if (skipped.length === pending.length) throw new AgentRequestError(400, 'Keep at least one change in scope');
      if (skipped.length > 0) await updateConventionChangePropagations(client, { ids: skipped, status: 'skipped', reason: 'Left out when the template run was confirmed' });
      await updateAgentRun(client, id, { input: { ...run.input, change_ids: pending.filter((row) => keep.has(row.convention_change_id)).map((row) => row.convention_change_id) } });
    }
  }
  return start(client, run, { instructions: input.instructions });
};

/** Approve: applies the run's output (per agent) and creates the next agent's draft(s). */
export const processApproveAgentRun = async (
  client: CanonicalDataClient,
  id: string,
  input: { note: string; decisions?: ConventionDecision[] },
): Promise<{ run: AgentRun; next: AgentRun[] }> => {
  const run = await requireRun(client, id);
  requireStatus(run, ['needs_review'], 'approve');
  if (run.agent === 'pr') return approvePrAgentRun(client, run, input.note);
  if (run.agent === 'convention') return approveConventionAgentRun(client, run, { decisions: input.decisions ?? [], note: input.note });
  return approveTemplateAgentRun(client, run, input.note);
};

/** Reject: ends the chain. Convention proposals are rejected; template PRs are closed (optional revert). */
export const processRejectAgentRun = async (
  client: CanonicalDataClient,
  id: string,
  input: { note: string; revertChanges: boolean },
): Promise<{ run: AgentRun; reverted?: number; notes?: string[] }> => {
  const run = await requireRun(client, id);
  requireStatus(run, ['needs_review'], 'reject');
  if (run.agent === 'template') return rejectTemplateAgentRun(client, run, { note: input.note, revert: input.revertChanges });
  if (run.agent === 'convention') await closeProposedConventionChanges(client, { status: 'rejected', source_type: 'convention_agent', source_id: run.id, reason: input.note });
  const rejected = await updateAgentRun(client, id, { status: 'rejected', decision_note: input.note, decided_at: now() }, ['needs_review']);
  if (!rejected) throw new AgentRequestError(409, 'This run is no longer waiting for review');
  return { run: rejected };
};

/** Dismiss: drops a draft that hasn't started. A template draft's changes are marked skipped in every repo. */
export const processDismissAgentRun = async (client: CanonicalDataClient, id: string, input: { note: string }): Promise<AgentRun> => {
  const run = await requireRun(client, id);
  requireStatus(run, ['draft'], 'dismiss');
  if (run.agent === 'template') {
    await updateConventionChangePropagations(client, { run_id: run.id, from_statuses: ['pending'], status: 'skipped', reason: input.note || 'Template draft dismissed' });
  }
  const dismissed = await updateAgentRun(client, id, { status: 'dismissed', decision_note: input.note, decided_at: now() }, ['draft']);
  if (!dismissed) throw new AgentRequestError(409, 'This run already started');
  return dismissed;
};

/** Retry: failed → running with the same input (lineage unchanged). */
export const processRetryAgentRun = async (client: CanonicalDataClient, id: string): Promise<AgentRun> => {
  requireAnthropic();
  const run = await requireRun(client, id);
  requireStatus(run, ['failed'], 'retry');
  const retried = await updateAgentRun(client, id, { status: 'running', started_at: now(), finished_at: null, error: null }, ['failed']);
  if (!retried) throw new AgentRequestError(409, 'This run is no longer failed');
  executeAgentRun(client, retried.id);
  return retried;
};

/**
 * Revise: supersedes a run waiting for review with a new version that carries the reviewer's
 * feedback (PR: the new feedback; convention/template: revise_feedback). Template revisions keep
 * the same PRs and take over the carried changes in every repo. Starts right away unless runNow is false.
 */
export const processReviseAgentRun = async (
  client: CanonicalDataClient,
  id: string,
  input: { feedback: string; runNow: boolean },
): Promise<AgentRun> => {
  const run = await requireRun(client, id);
  requireStatus(run, ['needs_review', 'no_change', 'failed'], 'revise');
  const feedback = input.feedback.trim();
  if (!feedback) throw new AgentRequestError(400, 'Feedback is required to revise');

  const nextInput = run.agent === 'pr' ? { ...run.input, feedback } : { ...run.input, revise_feedback: feedback };
  // There is at most one template draft (the one collecting new changes), so template revisions
  // skip draft and start immediately.
  const startNow = input.runNow || run.agent === 'template';
  if (startNow) requireAnthropic();
  const next = await createAgentRun(client, {
    agent: run.agent,
    status: run.agent === 'template' ? 'running' : 'draft',
    version: run.version + 1,
    revision_of_run_id: run.id,
    parent_run_id: run.parent_run_id,
    root_run_id: run.root_run_id ?? run.id,
    software_system_id: run.software_system_id,
    delivery_id: run.delivery_id,
    role_key: run.role_key,
    template_change_ids: run.template_change_ids,
    title: run.agent === 'pr' ? titleFrom(feedback) : run.title,
    input: nextInput,
    instructions: run.instructions,
  });
  if (run.agent === 'pr' && !run.root_run_id) await updateAgentRun(client, next.id, { root_run_id: run.id });
  if (run.agent === 'convention') await closeProposedConventionChanges(client, { status: 'superseded', source_type: 'convention_agent', source_id: run.id });
  if (run.agent === 'template') {
    await updateConventionChangePropagations(client, { run_id: run.id, from_statuses: ['pending', 'in_run', 'not_needed'], status: 'pending', set_run_id: next.id });
  }
  await updateAgentRun(client, run.id, { status: 'superseded', decision_note: feedback, decided_at: now() }, ['needs_review', 'no_change', 'failed']);
  if (run.agent === 'template') {
    const running = (await updateAgentRun(client, next.id, { confirmed_at: now(), started_at: now() })) ?? next;
    executeAgentRun(client, running.id);
    return running;
  }
  return startNow ? start(client, next) : next;
};
