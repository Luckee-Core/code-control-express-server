import type { Project } from '../../model/project';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Loads all customer projects (most recently updated first) from Storage Express.
 */
export const getAllProjects = async (storage: StorageClient): Promise<Project[]> =>
  invokeStorageOperation<Project[]>(storage, 'getAllProjects');
