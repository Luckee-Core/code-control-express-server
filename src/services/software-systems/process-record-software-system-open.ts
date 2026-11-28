import { createSoftwareSystemOpen } from '../../data/software-system-opens';
import { getSoftwareSystemById } from '../../data/software-systems';
import type { SoftwareSystemOpen } from '../../model/software-system-open';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Records a detail-page open for POST /api/data/software-systems/:id/opens (null when the system is missing).
 */
export const processRecordSoftwareSystemOpen = async (
  client: CanonicalDataClient,
  id: string,
): Promise<SoftwareSystemOpen | null> => {
  const system = await getSoftwareSystemById(client, id);
  if (!system) return null;
  return createSoftwareSystemOpen(client, id);
};
