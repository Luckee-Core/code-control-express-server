import type { CreateTicketBuildInput, TicketBuild } from '../../model/ticket-build';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a ticket build (status planning).
 */
export const createTicketBuild = async (
  client: CanonicalDataClient,
  input: CreateTicketBuildInput,
): Promise<TicketBuild> => invokeCanonicalDataOperation<TicketBuild>(client, 'createTicketBuild', [input]);
