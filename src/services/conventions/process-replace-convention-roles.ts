import { replaceConventionRoles } from '../../data/convention-roles';
import type { ConventionRole } from '../../model/convention-role';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Replaces a convention's roles for PUT /api/data/conventions/:id/roles.
 */
export const processReplaceConventionRoles = async (
  client: CanonicalDataClient,
  conventionId: string,
  roleKeys: string[]
): Promise<ConventionRole[]> => replaceConventionRoles(client, conventionId, roleKeys);
