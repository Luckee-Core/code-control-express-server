import type { InsertProjectRepoInput } from '../../model/project-repo';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Inserts a customer_project_repos row via Storage Express.
 */
export const insertProjectRepo = async (
  storage: StorageClient,
  input: InsertProjectRepoInput
): Promise<{ id: string }> =>
  invokeStorageOperation<{ id: string }>(storage, 'insertProjectRepo', [input]);
