import { listRecentSoftwareSystemOpens } from '../../data/software-system-opens';
import type { RecentSoftwareSystemOpen } from '../../model/software-system-open';
import type { CanonicalDataClient } from '../canonical-data-client';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

/**
 * Lists recently opened software systems for GET /api/data/software-systems/recent-opens.
 * Limit defaults to 5 and is capped at 20.
 */
export const processListRecentSoftwareSystemOpens = async (
  client: CanonicalDataClient,
  requestedLimit: number | null,
): Promise<RecentSoftwareSystemOpen[]> => {
  const limit =
    requestedLimit && Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;
  return listRecentSoftwareSystemOpens(client, limit);
};
