import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Gets one ticket build repo; null when not found.
 */
export const getTicketBuildRepoById = async (
  client: CanonicalDataClient,
  id: string,
): Promise<TicketBuildRepo | null> => invokeCanonicalDataOperation<TicketBuildRepo | null>(client, 'getTicketBuildRepoById', [id]);
