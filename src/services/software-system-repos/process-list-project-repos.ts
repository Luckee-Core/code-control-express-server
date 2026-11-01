import { getAllSoftwareSystemRepos } from '../../data/software-system-repos';
import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists every linked repo for GET /api/data/project-repos.
 */
export const processListSoftwareSystemRepos = async (client: CanonicalDataClient): Promise<SoftwareSystemRepo[]> =>
  getAllSoftwareSystemRepos(client);
