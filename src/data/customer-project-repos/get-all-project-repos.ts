import type { ProjectRepo } from '../../model/project-repo';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Loads every customer_project_repos row (newest first) from Storage Express.
 */
export const getAllProjectRepos = async (storage: StorageClient): Promise<ProjectRepo[]> =>
  invokeStorageOperation<ProjectRepo[]>(storage, 'getAllProjectRepos');
