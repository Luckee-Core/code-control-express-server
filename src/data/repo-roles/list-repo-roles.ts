import type { RepoRole } from '../../model/repo-role';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists repo roles. (Storage Express `listRepoRoles`)
 */
export const listRepoRoles = async (
  client: CanonicalDataClient
): Promise<RepoRole[]> => invokeCanonicalDataOperation<RepoRole[]>(client, 'listRepoRoles', []);
