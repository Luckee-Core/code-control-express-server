import type { ConventionRole } from '../../model/convention-role';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists convention ↔ role links, optionally for one convention. (Storage Express invoke)
 */
export const listConventionRoles = async (
  client: CanonicalDataClient,
  conventionId: string | null = null,
): Promise<ConventionRole[]> =>
  invokeCanonicalDataOperation<ConventionRole[]>(client, 'listConventionRoles', [conventionId]);
