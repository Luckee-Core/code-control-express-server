import type { ConventionExample } from '../../model/convention-example';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists examples, optionally for one convention. (Storage Express invoke)
 */
export const listConventionExamples = async (
  client: CanonicalDataClient,
  conventionId: string | null = null,
): Promise<ConventionExample[]> =>
  invokeCanonicalDataOperation<ConventionExample[]>(client, 'listConventionExamples', [conventionId]);
