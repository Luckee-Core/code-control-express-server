import { getTicketBuildById, updateTicketBuild } from '../../data/ticket-builds';
import type { TicketBuild } from '../../model/ticket-build';
import type { CanonicalDataClient } from '../canonical-data-client';
import { MAX_CONTRACT_CHARS } from './config';
import { TicketBuildRequestError } from './ticket-build-request-error';

/** Saves the user's edits to the shared contract while the plan is waiting for review. */
export const processUpdateTicketBuild = async (
  client: CanonicalDataClient,
  id: string,
  input: { contractText: string },
): Promise<TicketBuild> => {
  const build = await getTicketBuildById(client, id);
  if (!build) throw new TicketBuildRequestError(404, 'Ticket build not found');
  if (build.status !== 'plan_ready') throw new TicketBuildRequestError(409, 'The plan can only be edited while it is waiting for review');
  if (input.contractText.length > MAX_CONTRACT_CHARS) {
    throw new TicketBuildRequestError(400, `The contract is limited to ${MAX_CONTRACT_CHARS} characters`);
  }
  return (await updateTicketBuild(client, id, { contract_text: input.contractText })) ?? build;
};
