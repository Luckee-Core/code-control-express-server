import { getAllProjectRepos } from '../../data/customer-project-repos';
import type { ProjectRepo } from '../../model/project-repo';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists every linked repo for GET /api/data/project-repos.
 */
export const processListProjectRepos = async (client: CanonicalDataClient): Promise<ProjectRepo[]> =>
  getAllProjectRepos(client);
