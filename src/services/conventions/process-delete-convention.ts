import { deleteConvention } from '../../data/conventions';
import type { ConventionChangeContext } from '../../model/convention-change';
import type { CanonicalDataClient } from '../canonical-data-client';
import { scheduleTemplateSync } from '../agent-runs/sync-template-drafts';

/**
 * Deletes a convention; returns false when it did not exist. The ledger keeps the deleted row.
 */
export const processDeleteConvention = async (
  client: CanonicalDataClient,
  id: string,
  change: ConventionChangeContext = {},
): Promise<boolean> => {
  const result = await deleteConvention(client, id, change);
  if (result.deleted) scheduleTemplateSync(client);
  return result.deleted;
};
