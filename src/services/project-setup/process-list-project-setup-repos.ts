import { getProjectReposByProjectId } from '../../data/customer-project-repos';
import type { ProjectRepo } from '../../model/project-repo';
import type { StorageClient } from '../storage-client';

/**
 * Lists repos linked to one project for the project setup screen.
 */
export const processListProjectSetupRepos = async (
  storage: StorageClient,
  projectId: string
): Promise<ProjectRepo[]> => getProjectReposByProjectId(storage, projectId);
