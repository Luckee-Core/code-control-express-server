import { getTicketBuildRepoById, updateTicketBuildRepo } from '../../data/ticket-build-repos';
import { getTicketBuildById } from '../../data/ticket-builds';
import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import type { CanonicalDataClient } from '../canonical-data-client';
import { MAX_REPO_PLAN_CHARS } from '../ticket-builds/config';
import { TicketBuildRequestError } from '../ticket-builds/ticket-build-request-error';

/** Saves the user's edit to one repo's plan or its include toggle while the plan waits for review. */
export const processUpdateTicketBuildRepo = async (
  client: CanonicalDataClient,
  id: string,
  input: { planText?: string; included?: boolean },
): Promise<TicketBuildRepo> => {
  const repo = await getTicketBuildRepoById(client, id);
  if (!repo) throw new TicketBuildRequestError(404, 'Ticket build repo not found');
  const build = await getTicketBuildById(client, repo.ticket_build_id);
  if (!build || build.status !== 'plan_ready') {
    throw new TicketBuildRequestError(409, 'Repo plans can only be edited while the plan is waiting for review');
  }
  if (input.planText !== undefined && input.planText.length > MAX_REPO_PLAN_CHARS) {
    throw new TicketBuildRequestError(400, `A repo plan is limited to ${MAX_REPO_PLAN_CHARS} characters`);
  }
  const included = input.included ?? repo.included;
  return (
    (await updateTicketBuildRepo(client, id, {
      ...(input.planText !== undefined ? { plan_text: input.planText } : {}),
      included,
      status: included ? 'pending' : 'skipped',
    })) ?? repo
  );
};
