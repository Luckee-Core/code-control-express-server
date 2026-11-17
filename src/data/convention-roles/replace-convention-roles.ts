import type { ConventionRole } from '../../model/convention-role';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Replaces the roles linked to a convention. (Storage Express invoke)
 */
export const replaceConventionRoles = async (
  client: CanonicalDataClient,
  conventionId: string,
  roleKeys: string[],
): Promise<ConventionRole[]> =>
  invokeCanonicalDataOperation<ConventionRole[]>(client, 'replaceConventionRoles', [conventionId, roleKeys]);
