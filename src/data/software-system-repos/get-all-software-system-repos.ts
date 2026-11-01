import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads every software_system_repos row (newest first) from Storage Express.
 */
export const getAllSoftwareSystemRepos = async (client: CanonicalDataClient): Promise<SoftwareSystemRepo[]> =>
  invokeCanonicalDataOperation<SoftwareSystemRepo[]>(client, 'getAllSoftwareSystemRepos');
