import type { ConventionDomain } from '../../model/convention-domain';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists convention domains. (Storage Express `listConventionDomains`)
 */
export const listConventionDomains = async (
  client: CanonicalDataClient
): Promise<ConventionDomain[]> => invokeCanonicalDataOperation<ConventionDomain[]>(client, 'listConventionDomains', []);
