import type { TemplateChange, UpdateTemplateChangeInput } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a template change; null when missing. (Storage Express invoke)
 */
export const updateTemplateChange = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateTemplateChangeInput,
): Promise<TemplateChange | null> =>
  invokeCanonicalDataOperation<TemplateChange | null>(client, 'updateTemplateChange', [id, input]);
