import type { ProjectRepo } from '../../model/project-repo';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Loads repos for one project (ordered by repo_type) from Storage Express.
 */
export const getProjectReposByProjectId = async (
  storage: StorageClient,
  projectId: string
): Promise<ProjectRepo[]> =>
  invokeStorageOperation<ProjectRepo[]>(storage, 'getProjectReposByProjectId', [projectId]);
