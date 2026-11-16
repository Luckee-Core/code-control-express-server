import type { ConventionExample } from '../../model/convention-example';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists convention examples, optionally for one convention. (Storage Express `listConventionExamples`)
 */
export const listConventionExamples = async (
  client: CanonicalDataClient,
  conventionId?: string
): Promise<ConventionExample[]> => invokeCanonicalDataOperation<ConventionExample[]>(client, 'listConventionExamples', conventionId ? [conventionId] : []);
