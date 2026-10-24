import type { Project, UpdateProjectInput } from '../../model/project';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a customer_projects row via Storage Express.
 */
export const updateProject = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateProjectInput
): Promise<Project> => invokeCanonicalDataOperation<Project>(client, 'updateProject', [id, input]);
