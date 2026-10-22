import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Deletes a customer_projects row via Storage Express.
 */
export const deleteProject = async (storage: StorageClient, id: string): Promise<void> => {
  await invokeStorageOperation<null>(storage, 'deleteProject', [id]);
};
