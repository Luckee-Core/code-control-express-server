import { getProjectById } from '../../data/customer-projects';
import type { Project } from '../../model/project';
import type { StorageClient } from '../storage-client';

/**
 * Loads one project for GET /api/data/projects/:id (null when missing).
 */
export const processGetProject = async (
  storage: StorageClient,
  id: string
): Promise<Project | null> => getProjectById(storage, id);
