import type { TicketBuild } from '../../model/ticket-build';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists a software system's ticket builds, newest first.
 */
export const listTicketBuildsBySoftwareSystemId = async (
  client: CanonicalDataClient,
  softwareSystemId: string,
): Promise<TicketBuild[]> => invokeCanonicalDataOperation<TicketBuild[]>(client, 'listTicketBuildsBySoftwareSystemId', [softwareSystemId]);
