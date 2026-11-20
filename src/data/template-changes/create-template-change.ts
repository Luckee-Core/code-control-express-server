import type { CreateTemplateChangeInput, TemplateChange } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a template change (one template repo PR). (Storage Express invoke)
 */
export const createTemplateChange = async (
  client: CanonicalDataClient,
  input: CreateTemplateChangeInput,
): Promise<TemplateChange> =>
  invokeCanonicalDataOperation<TemplateChange>(client, 'createTemplateChange', [input]);
