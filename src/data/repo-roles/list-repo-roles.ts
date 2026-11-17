import type { RepoRole } from '../../model/repo-role';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists repo roles in edit order. (Storage Express invoke)
 */
export const listRepoRoles = async (client: CanonicalDataClient): Promise<RepoRole[]> =>
  invokeCanonicalDataOperation<RepoRole[]>(client, 'listRepoRoles', []);
