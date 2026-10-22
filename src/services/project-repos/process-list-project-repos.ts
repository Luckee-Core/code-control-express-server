import { getAllProjectRepos } from '../../data/customer-project-repos';
import type { ProjectRepo } from '../../model/project-repo';
import type { StorageClient } from '../storage-client';

/**
 * Lists every linked repo for GET /api/data/project-repos.
 */
export const processListProjectRepos = async (storage: StorageClient): Promise<ProjectRepo[]> =>
  getAllProjectRepos(storage);
