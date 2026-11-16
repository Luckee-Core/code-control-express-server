import type { ConventionRole } from '../../model/convention-role';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Replaces a convention's repo roles in one transaction. (Storage Express `replaceConventionRoles`)
 */
export const replaceConventionRoles = async (
  client: CanonicalDataClient,
  conventionId: string,
  roleKeys: string[]
): Promise<ConventionRole[]> => invokeCanonicalDataOperation<ConventionRole[]>(client, 'replaceConventionRoles', [conventionId, roleKeys]);
