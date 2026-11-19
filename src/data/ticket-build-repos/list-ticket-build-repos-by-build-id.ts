import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists a ticket build's repos by position.
 */
export const listTicketBuildReposByBuildId = async (
  client: CanonicalDataClient,
  ticketBuildId: string,
): Promise<TicketBuildRepo[]> => invokeCanonicalDataOperation<TicketBuildRepo[]>(client, 'listTicketBuildReposByBuildId', [ticketBuildId]);
