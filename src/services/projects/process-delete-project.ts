import { deleteProject } from '../../data/customer-projects';
import type { StorageClient } from '../storage-client';

/**
 * Deletes a project for DELETE /api/data/projects/:id.
 */
export const processDeleteProject = async (storage: StorageClient, id: string): Promise<void> =>
  deleteProject(storage, id);
