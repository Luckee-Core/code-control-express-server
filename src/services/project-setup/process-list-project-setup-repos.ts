import { getProjectReposByProjectId } from '../../data/customer-project-repos';
import type { ProjectRepo } from '../../model/project-repo';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists repos linked to one project for the project setup screen.
 */
export const processListProjectSetupRepos = async (
  client: CanonicalDataClient,
  projectId: string
): Promise<ProjectRepo[]> => getProjectReposByProjectId(client, projectId);
