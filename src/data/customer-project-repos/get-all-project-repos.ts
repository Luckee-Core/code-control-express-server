import type { ProjectRepo } from '../../model/project-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads every customer_project_repos row (newest first) from Storage Express.
 */
export const getAllProjectRepos = async (client: CanonicalDataClient): Promise<ProjectRepo[]> =>
  invokeCanonicalDataOperation<ProjectRepo[]>(client, 'getAllProjectRepos');
