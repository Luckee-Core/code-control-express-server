import type { Project } from '../../model/project';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Loads projects for a customer (oldest first) from Storage Express.
 */
export const getProjectsByCustomerId = async (
  storage: StorageClient,
  customerId: string
): Promise<Project[]> =>
  invokeStorageOperation<Project[]>(storage, 'getProjectsByCustomerId', [customerId]);
