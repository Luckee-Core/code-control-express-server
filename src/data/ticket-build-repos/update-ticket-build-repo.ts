import type { TicketBuildRepo, UpdateTicketBuildRepoInput } from '../../model/ticket-build-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a ticket build repo; null when not found.
 */
export const updateTicketBuildRepo = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateTicketBuildRepoInput,
): Promise<TicketBuildRepo | null> => invokeCanonicalDataOperation<TicketBuildRepo | null>(client, 'updateTicketBuildRepo', [id, input]);
