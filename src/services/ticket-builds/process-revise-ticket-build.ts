import { listTicketBuildReposByBuildId } from '../../data/ticket-build-repos';
import { getTicketBuildById, updateTicketBuild } from '../../data/ticket-builds';
import type { TicketBuild } from '../../model/ticket-build';
import { getManagedAnthropicClient } from '../ai';
import type { CanonicalDataClient } from '../canonical-data-client';
import { MAX_FEEDBACK_CHARS } from './config';
import { startTicketBuildPlan } from './run-ticket-build-plan';
import { TicketBuildRequestError } from './ticket-build-request-error';

/**
 * Re-plans with the user's feedback, using the current (edited) contract and repo plans as input.
 * Allowed while the plan is ready for review or after it failed.
 */
export const processReviseTicketBuild = async (
  client: CanonicalDataClient,
  id: string,
  input: { feedback: string },
): Promise<TicketBuild> => {
  const anthropic = getManagedAnthropicClient();
  if (!anthropic) throw new TicketBuildRequestError(503, 'ANTHROPIC_API_KEY is not set on the Express server');
  const build = await getTicketBuildById(client, id);
  if (!build) throw new TicketBuildRequestError(404, 'Ticket build not found');
  if (build.status !== 'plan_ready' && build.status !== 'plan_failed') {
    throw new TicketBuildRequestError(409, 'Only a plan waiting for review (or a failed plan) can be revised');
  }
  const feedback = input.feedback.trim();
  if (feedback.length > MAX_FEEDBACK_CHARS) throw new TicketBuildRequestError(400, `Feedback is limited to ${MAX_FEEDBACK_CHARS} characters`);

  const repos = await listTicketBuildReposByBuildId(client, id);
  const updated = (await updateTicketBuild(client, id, { status: 'planning', feedback, error: null })) ?? build;
  startTicketBuildPlan(client, anthropic, {
    build: updated,
    purpose: 'revise',
    revise: { feedback: feedback || 'Plan again with the current edits.', repos },
  });
  return updated;
};
