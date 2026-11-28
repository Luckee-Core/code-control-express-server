import { updateSystemBuildRunStep } from '../../data/system-build-run-steps';
import type { SystemBuildRepoProgress, SystemBuildStepProgress } from '../../model/system-build-run-step';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { DeliveryProgressListener } from '../data-model-deliveries/types';

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** Phases a resumed step reports again for a repo this run already merged (it is skipped as merged). */
const REVISIT_PHASES = new Set(['queued', 'checking', 'unchanged']);

/**
 * A delivery progress listener that keeps one entry per repo (by role) and saves the whole list on
 * the step after each move, so the In progress view can poll it. It starts from the step's saved
 * progress, so when Continue re-runs a paused step, repos this run already merged stay `merged`.
 * A failed write is logged, never thrown.
 */
export const trackStepProgress = (
  client: CanonicalDataClient,
  stepId: string,
  saved: SystemBuildStepProgress | null,
): DeliveryProgressListener => {
  const repos: SystemBuildRepoProgress[] = [...(saved?.repos ?? [])];
  return async (event) => {
    const previous = repos.find((entry) => entry.role === event.role);
    if (previous?.phase === 'merged' && REVISIT_PHASES.has(event.phase)) return;
    const next: SystemBuildRepoProgress = {
      role: event.role,
      repo: event.repo,
      phase: event.phase,
      files: event.files !== undefined ? event.files : (previous?.files ?? null),
      pr_url: event.pr_url !== undefined ? event.pr_url : (previous?.pr_url ?? null),
      pr_number: event.pr_number !== undefined ? event.pr_number : (previous?.pr_number ?? null),
      error: event.error ?? null,
      updated_at: new Date().toISOString(),
    };
    if (previous) repos.splice(repos.indexOf(previous), 1, next);
    else repos.push(next);
    const progress: SystemBuildStepProgress = { repos: [...repos] };
    try {
      await updateSystemBuildRunStep(client, stepId, { progress });
    } catch (error) {
      console.warn('⚠️ [system-build-runs] Could not save step progress', { step: stepId, error: errorMessage(error) });
    }
  };
};
