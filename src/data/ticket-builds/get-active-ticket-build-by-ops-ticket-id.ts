import type { TicketBuild } from '../../model/ticket-build';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * The ticket's active build (planning, plan_ready or building); null when none.
 */
export const getActiveTicketBuildByOpsTicketId = async (
  client: CanonicalDataClient,
  opsTicketId: string,
): Promise<TicketBuild | null> => invokeCanonicalDataOperation<TicketBuild | null>(client, 'getActiveTicketBuildByOpsTicketId', [opsTicketId]);
