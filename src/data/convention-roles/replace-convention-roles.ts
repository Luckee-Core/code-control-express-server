import type { ConventionChangeContext } from '../../model/convention-change';
import type { ConventionRole } from '../../model/convention-role';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Replaces the roles linked to a convention. Writes a convention_changes ledger row in the same storage transaction. (Storage Express invoke)
 */
export const replaceConventionRoles = async (
  client: CanonicalDataClient,
  conventionId: string,
  roleKeys: string[],
  change?: ConventionChangeContext,
): Promise<ConventionRole[]> =>
  invokeCanonicalDataOperation<ConventionRole[]>(client, 'replaceConventionRoles', [conventionId, roleKeys, change ?? {}]);
