import type { TicketBuild, UpdateTicketBuildInput } from '../../model/ticket-build';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a ticket build; null when not found.
 */
export const updateTicketBuild = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateTicketBuildInput,
): Promise<TicketBuild | null> => invokeCanonicalDataOperation<TicketBuild | null>(client, 'updateTicketBuild', [id, input]);
