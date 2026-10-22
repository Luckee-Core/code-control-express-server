import { getAllProjects } from '../../data/customer-projects';
import type { Project } from '../../model/project';
import type { StorageClient } from '../storage-client';

/**
 * Lists all projects for GET /api/data/projects.
 */
export const processListProjects = async (storage: StorageClient): Promise<Project[]> =>
  getAllProjects(storage);
