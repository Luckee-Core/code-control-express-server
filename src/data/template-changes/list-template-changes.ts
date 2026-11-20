import type { TemplateChange, TemplateChangeStatus } from '../../model/agent-run';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Template changes newest first. (Storage Express invoke)
 */
export const listTemplateChanges = async (
  client: CanonicalDataClient,
  filter: { ids?: string[]; repo_full_name?: string; status?: TemplateChangeStatus } = {},
): Promise<TemplateChange[]> =>
  invokeCanonicalDataOperation<TemplateChange[]>(client, 'listTemplateChanges', [filter]);
