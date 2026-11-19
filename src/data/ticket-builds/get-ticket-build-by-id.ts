import type { TicketBuild } from '../../model/ticket-build';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Gets one ticket build; null when not found.
 */
export const getTicketBuildById = async (
  client: CanonicalDataClient,
  id: string,
): Promise<TicketBuild | null> => invokeCanonicalDataOperation<TicketBuild | null>(client, 'getTicketBuildById', [id]);
