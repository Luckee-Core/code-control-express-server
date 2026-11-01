import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads repos for one software system from Storage Express.
 */
export const getSoftwareSystemReposBySoftwareSystemId = async (
  client: CanonicalDataClient,
  softwareSystemId: string,
): Promise<SoftwareSystemRepo[]> =>
  invokeCanonicalDataOperation<SoftwareSystemRepo[]>(
    client,
    'getSoftwareSystemReposBySoftwareSystemId',
    [softwareSystemId],
  );
