import type { TicketBuild } from '../../model/ticket-build';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists the builds for one My Ops Tracker ticket, newest first.
 */
export const listTicketBuildsByOpsTicketId = async (
  client: CanonicalDataClient,
  opsTicketId: string,
): Promise<TicketBuild[]> => invokeCanonicalDataOperation<TicketBuild[]>(client, 'listTicketBuildsByOpsTicketId', [opsTicketId]);
