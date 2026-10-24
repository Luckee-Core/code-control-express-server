import { getAllProjects } from '../../data/customer-projects';
import type { Project } from '../../model/project';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists all projects for GET /api/data/projects.
 */
export const processListProjects = async (client: CanonicalDataClient): Promise<Project[]> =>
  getAllProjects(client);
