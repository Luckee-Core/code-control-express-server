import { createProject } from '../../data/customer-projects';
import type { CreateProjectInput, Project } from '../../model/project';
import type { StorageClient } from '../storage-client';

/**
 * Creates a project for POST /api/data/projects.
 */
export const processCreateProject = async (
  storage: StorageClient,
  input: CreateProjectInput
): Promise<Project> => createProject(storage, input);
