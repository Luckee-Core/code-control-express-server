import { deleteProject } from '../../data/customer-projects';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Deletes a project for DELETE /api/data/projects/:id.
 */
export const processDeleteProject = async (client: CanonicalDataClient, id: string): Promise<void> =>
  deleteProject(client, id);
