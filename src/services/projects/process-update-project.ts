import { updateProject } from '../../data/customer-projects';
import type { Project, UpdateProjectInput } from '../../model/project';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Updates a project for PATCH /api/data/projects/:id.
 */
export const processUpdateProject = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateProjectInput
): Promise<Project> => updateProject(client, id, input);
