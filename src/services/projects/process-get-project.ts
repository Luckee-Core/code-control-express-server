import { getProjectById } from '../../data/customer-projects';
import type { Project } from '../../model/project';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Loads one project for GET /api/data/projects/:id (null when missing).
 */
export const processGetProject = async (
  client: CanonicalDataClient,
  id: string
): Promise<Project | null> => getProjectById(client, id);
