import type { ProjectRepo } from '../../model/project-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads repos for one project (ordered by repo_type) from Storage Express.
 */
export const getProjectReposByProjectId = async (
  client: CanonicalDataClient,
  projectId: string
): Promise<ProjectRepo[]> =>
  invokeCanonicalDataOperation<ProjectRepo[]>(client, 'getProjectReposByProjectId', [projectId]);
