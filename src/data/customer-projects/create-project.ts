import type { CreateProjectInput, Project } from '../../model/project';
import { invokeStorageOperation, type StorageClient } from '../../services/storage-client';

/**
 * Inserts a customer_projects row via Storage Express.
 */
export const createProject = async (
  storage: StorageClient,
  input: CreateProjectInput
): Promise<Project> => invokeStorageOperation<Project>(storage, 'createProject', [input]);
