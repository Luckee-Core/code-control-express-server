import type { RecentSoftwareSystemOpen } from '../../model/software-system-open';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists the most recently opened software systems, one row each, newest first.
 */
export const listRecentSoftwareSystemOpens = async (
  client: CanonicalDataClient,
  limit: number,
): Promise<RecentSoftwareSystemOpen[]> =>
  invokeCanonicalDataOperation<RecentSoftwareSystemOpen[]>(client, 'listRecentSoftwareSystemOpens', [limit]);
