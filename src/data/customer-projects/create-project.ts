import type { CreateProjectInput, Project } from '../../model/project';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Inserts a customer_projects row via Storage Express.
 */
export const createProject = async (
  client: CanonicalDataClient,
  input: CreateProjectInput
): Promise<Project> => invokeCanonicalDataOperation<Project>(client, 'createProject', [input]);
