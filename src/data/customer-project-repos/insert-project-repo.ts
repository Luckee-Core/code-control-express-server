import type { InsertProjectRepoInput } from '../../model/project-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Inserts a customer_project_repos row via Storage Express.
 */
export const insertProjectRepo = async (
  client: CanonicalDataClient,
  input: InsertProjectRepoInput
): Promise<{ id: string }> =>
  invokeCanonicalDataOperation<{ id: string }>(client, 'insertProjectRepo', [input]);
