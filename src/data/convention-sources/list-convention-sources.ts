import type { ConventionSource } from '../../model/convention-source';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists sources, optionally for one convention. (Storage Express invoke)
 */
export const listConventionSources = async (
  client: CanonicalDataClient,
  conventionId: string | null = null,
): Promise<ConventionSource[]> =>
  invokeCanonicalDataOperation<ConventionSource[]>(client, 'listConventionSources', [conventionId]);
