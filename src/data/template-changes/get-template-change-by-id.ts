import type { TemplateChange } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * One template change, or null. (Storage Express invoke)
 */
export const getTemplateChangeById = async (
  client: CanonicalDataClient,
  id: string,
): Promise<TemplateChange | null> =>
  invokeCanonicalDataOperation<TemplateChange | null>(client, 'getTemplateChangeById', [id]);
