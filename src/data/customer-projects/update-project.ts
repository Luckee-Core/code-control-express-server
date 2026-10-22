import type { Project, UpdateProjectInput } from '../../model/project';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Updates a customer_projects row via Storage Express.
 */
export const updateProject = async (
  storage: StorageClient,
  id: string,
  input: UpdateProjectInput
): Promise<Project> => invokeStorageOperation<Project>(storage, 'updateProject', [id, input]);
