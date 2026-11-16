import type { ConventionSource } from '../../model/convention-source';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists convention sources, optionally for one convention. (Storage Express `listConventionSources`)
 */
export const listConventionSources = async (
  client: CanonicalDataClient,
  conventionId?: string
): Promise<ConventionSource[]> => invokeCanonicalDataOperation<ConventionSource[]>(client, 'listConventionSources', conventionId ? [conventionId] : []);
