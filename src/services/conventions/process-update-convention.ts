import { replaceConventionRoles } from '../../data/convention-roles';
import { getConventionById, updateConvention } from '../../data/conventions';
import type { UpdateConventionInput } from '../../model/convention';
import type { ConventionChangeContext } from '../../model/convention-change';
import type { CanonicalDataClient } from '../canonical-data-client';
import { processGetConventionDetail } from './process-get-convention-detail';
import type { ConventionDetail } from './types';
import { scheduleTemplateSync } from '../agent-runs/sync-template-drafts';

/**
 * Updates a convention (and replaces its roles when role_keys is provided). Null when missing.
 * Storage writes one ledger row per kind of change (e.g. refine + role_change), all with `change`.
 */
export const processUpdateConvention = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionInput,
  roleKeys: string[] | undefined,
  change: ConventionChangeContext = {},
): Promise<ConventionDetail | null> => {
  const existing = await getConventionById(client, id);
  if (!existing) return null;

  const hasFieldChanges = Object.values(input).some((value) => value !== undefined);
  if (hasFieldChanges) {
    await updateConvention(client, id, input, change);
  }
  if (roleKeys) {
    await replaceConventionRoles(client, id, roleKeys, change);
  }
  if (hasFieldChanges || roleKeys) scheduleTemplateSync(client);
  return processGetConventionDetail(client, id);
};
