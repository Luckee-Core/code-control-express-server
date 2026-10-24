import { createProject } from '../../data/customer-projects';
import type { CreateProjectInput, Project } from '../../model/project';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Creates a project for POST /api/data/projects.
 */
export const processCreateProject = async (
  client: CanonicalDataClient,
  input: CreateProjectInput
): Promise<Project> => createProject(client, input);
