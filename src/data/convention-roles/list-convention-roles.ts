import type { ConventionRole } from '../../model/convention-role';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists convention ↔ repo role links, optionally for one convention. (Storage Express `listConventionRoles`)
 */
export const listConventionRoles = async (
  client: CanonicalDataClient,
  conventionId?: string
): Promise<ConventionRole[]> => invokeCanonicalDataOperation<ConventionRole[]>(client, 'listConventionRoles', conventionId ? [conventionId] : []);
