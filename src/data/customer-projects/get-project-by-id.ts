import type { Project } from '../../model/project';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Loads one project by primary key from Storage Express.
 */
export const getProjectById = async (
  storage: StorageClient,
  id: string
): Promise<Project | null> =>
  invokeStorageOperation<Project | null>(storage, 'getProjectById', [id]);
