import { getSystemBuildRunById, updateSystemBuildRun } from '../../data/system-build-runs';
import { listSystemBuildRunStepsByRunId, updateSystemBuildRunStep } from '../../data/system-build-run-steps';
import type { SystemBuildRun } from '../../model/system-build-run';
import type { SystemBuildRunStep } from '../../model/system-build-run-step';
import type { CanonicalDataClient } from '../canonical-data-client';
import { processDeliverDataModel } from '../data-model-deliveries/process-deliver-data-model';
import type { DeliveryTarget } from '../data-model-deliveries/types';
import { tabLabel } from './config';
import { recordSystemBuildEvent } from './record-system-build-event';
import { trackStepProgress } from './track-step-progress';

/** Runs executing in this process (a `running` run missing here after a restart is stale). */
export const activeSystemBuildRuns = new Set<string>();

type StepOutcome = { result: 'merged' } | { result: 'skipped' } | { result: 'paused' } | { result: 'failed'; error: string };

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const prUrls = (targets: DeliveryTarget[]): string[] =>
  targets.map((target) => target.delivery?.pr_url ?? '').filter((url) => url.length > 0);

/**
 * Delivers one kind to every repo it applies to, squash-merging each PR (the existing delivery
 * code: same checks, rendering and merge as pressing Deliver on the tab), then records the outcome.
 */
const runStep = async (client: CanonicalDataClient, run: SystemBuildRun, step: SystemBuildRunStep): Promise<StepOutcome> => {
  const tab = tabLabel(step.kind);
  const now = () => new Date().toISOString();
  await updateSystemBuildRunStep(client, step.id, { status: 'running', note: null, error: null, started_at: now(), finished_at: null });
  await updateSystemBuildRun(client, run.id, { current_kind: step.kind });
  await recordSystemBuildEvent(client, { run_id: run.id, step_id: step.id, kind: step.kind, event_type: 'step_started', message: `${tab}: delivering` });

  let targets: DeliveryTarget[];
  try {
    targets = await processDeliverDataModel(client, {
      proposalId: run.proposal_id,
      kind: step.kind,
      autoMerge: true,
      onProgress: trackStepProgress(client, step.id, step.progress),
    });
  } catch (error) {
    const message = errorMessage(error);
    await updateSystemBuildRunStep(client, step.id, { status: 'failed', error: message, finished_at: now() });
    await recordSystemBuildEvent(client, { run_id: run.id, step_id: step.id, kind: step.kind, event_type: 'step_failed', message: `${tab}: ${message}` });
    return { result: 'failed', error: `${tab}: ${message}` };
  }

  const delivered = targets.filter((target) => target.repo && target.delivery);
  const delivery_ids = delivered.map((target) => target.delivery!.id);
  const detail = { pr_urls: prUrls(delivered), repos: delivered.map((target) => target.repo!.name) };

  const failed = delivered.filter((target) => target.delivery!.status === 'failed' || target.delivery!.status === 'closed');
  if (failed.length > 0) {
    const message = failed
      .map((target) => `${target.repo!.name}: ${target.delivery!.status === 'closed' ? 'the PR was closed without merging' : target.delivery!.error ?? 'delivery failed'}`)
      .join(' · ');
    await updateSystemBuildRunStep(client, step.id, { status: 'failed', delivery_ids, error: message, finished_at: now() });
    await recordSystemBuildEvent(client, { run_id: run.id, step_id: step.id, kind: step.kind, event_type: 'step_failed', message: `${tab}: ${message}`, detail });
    return { result: 'failed', error: `${tab}: ${message}` };
  }

  const open = delivered.filter((target) => target.delivery!.status !== 'merged');
  if (open.length > 0) {
    // The delivery's own note starts with the same sentence; keep only the reason GitHub gave.
    const reasons = open.map((target) => {
      const reason = (target.delivery!.error ?? '').replace(/^Auto-merge did not go through, so the PR is still open: /, '');
      return reason ? `${target.repo!.name} (${reason})` : target.repo!.name;
    });
    const note = `Auto-merge did not go through for ${reasons.join(', ')}. Merge on GitHub or fix the PR, then press Continue.`;
    await updateSystemBuildRunStep(client, step.id, { status: 'waiting_merge', delivery_ids, note });
    await recordSystemBuildEvent(client, { run_id: run.id, step_id: step.id, kind: step.kind, event_type: 'step_waiting', message: `${tab}: ${note}`, detail });
    return { result: 'paused' };
  }

  if (delivered.length === 0) {
    const note = 'No repo for this tab.';
    await updateSystemBuildRunStep(client, step.id, { status: 'skipped', note, finished_at: now() });
    await recordSystemBuildEvent(client, { run_id: run.id, step_id: step.id, kind: step.kind, event_type: 'step_skipped', message: `${tab}: ${note}` });
    return { result: 'skipped' };
  }

  await updateSystemBuildRunStep(client, step.id, { status: 'merged', delivery_ids, finished_at: now() });
  await recordSystemBuildEvent(client, { run_id: run.id, step_id: step.id, kind: step.kind, event_type: 'step_merged', message: `${tab}: merged in ${detail.repos.join(', ')}`, detail });
  return { result: 'merged' };
};

/**
 * Works through the run's remaining steps in order until it completes, pauses on a PR that did not
 * merge, fails, or is cancelled (checked between steps). Steps already merged or skipped are left as is.
 */
export const runSystemBuild = async (client: CanonicalDataClient, runId: string): Promise<void> => {
  for (;;) {
    const run = await getSystemBuildRunById(client, runId);
    if (!run || run.status !== 'running') return;
    const steps = await listSystemBuildRunStepsByRunId(client, run.id);
    const next = steps.find((step) => step.status !== 'merged' && step.status !== 'skipped');
    if (!next) {
      await updateSystemBuildRun(client, run.id, { status: 'completed', current_kind: null, error: null, finished_at: new Date().toISOString() });
      await recordSystemBuildEvent(client, { run_id: run.id, event_type: 'run_completed', message: 'Every tab is delivered and merged.' });
      return;
    }

    const outcome = await runStep(client, run, next);
    if (outcome.result === 'merged' || outcome.result === 'skipped') continue;

    const latest = await getSystemBuildRunById(client, run.id);
    if (!latest || latest.status !== 'running') return; // cancelled while the step ran
    if (outcome.result === 'paused') {
      await updateSystemBuildRun(client, run.id, { status: 'paused', error: null });
      return;
    }
    await updateSystemBuildRun(client, run.id, { status: 'failed', error: outcome.error });
    await recordSystemBuildEvent(client, { run_id: run.id, event_type: 'run_failed', message: 'Stopped. Fix the problem, then press Continue.' });
    return;
  }
};

/**
 * Runs the build in the background (no-op when it is already running here); an unexpected error
 * marks the run failed so it can be continued.
 */
export const startSystemBuildRun = (client: CanonicalDataClient, runId: string): void => {
  if (activeSystemBuildRuns.has(runId)) return;
  activeSystemBuildRuns.add(runId);
  void runSystemBuild(client, runId)
    .catch(async (error) => {
      const message = errorMessage(error);
      console.error('❌ [system-build-runs] Run crashed', { run: runId, error: message });
      try {
        await updateSystemBuildRun(client, runId, { status: 'failed', error: message });
        await recordSystemBuildEvent(client, { run_id: runId, event_type: 'run_failed', message });
      } catch (updateError) {
        console.error('❌ [system-build-runs] Could not mark run failed', updateError);
      }
    })
    .finally(() => activeSystemBuildRuns.delete(runId));
};
