import { updateProject } from '../../data/customer-projects';
import type { Project, UpdateProjectInput } from '../../model/project';
import type { StorageClient } from '../storage-client';

/**
 * Updates a project for PATCH /api/data/projects/:id.
 */
export const processUpdateProject = async (
  storage: StorageClient,
  id: string,
  input: UpdateProjectInput
): Promise<Project> => updateProject(storage, id, input);
