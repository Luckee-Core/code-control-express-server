import { listTicketBuildReposByBuildId } from '../../data/ticket-build-repos';
import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import type { CanonicalDataClient } from '../canonical-data-client';

/** Lists a ticket build's repos by position. */
export const processListTicketBuildRepos = async (client: CanonicalDataClient, ticketBuildId: string): Promise<TicketBuildRepo[]> =>
  listTicketBuildReposByBuildId(client, ticketBuildId);
