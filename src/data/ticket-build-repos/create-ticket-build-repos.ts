import type { CreateTicketBuildRepoInput, TicketBuildRepo } from '../../model/ticket-build-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a ticket build's repo rows.
 */
export const createTicketBuildRepos = async (
  client: CanonicalDataClient,
  inputs: CreateTicketBuildRepoInput[],
): Promise<TicketBuildRepo[]> => invokeCanonicalDataOperation<TicketBuildRepo[]>(client, 'createTicketBuildRepos', [inputs]);
