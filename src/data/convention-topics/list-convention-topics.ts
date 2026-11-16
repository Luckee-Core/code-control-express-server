import type { ConventionTopic } from '../../model/convention-topic';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists convention topics. (Storage Express `listConventionTopics`)
 */
export const listConventionTopics = async (
  client: CanonicalDataClient
): Promise<ConventionTopic[]> => invokeCanonicalDataOperation<ConventionTopic[]>(client, 'listConventionTopics', []);
