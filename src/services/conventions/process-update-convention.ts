import { replaceConventionRoles } from '../../data/convention-roles';
import { getConventionById, updateConvention } from '../../data/conventions';
import type { UpdateConventionInput } from '../../model/convention';
import type { CanonicalDataClient } from '../canonical-data-client';
import { processGetConventionDetail } from './process-get-convention-detail';
import type { ConventionDetail } from './types';

/**
 * Updates a convention (and replaces its roles when role_keys is provided). Null when missing.
 */
export const processUpdateConvention = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionInput,
  roleKeys: string[] | undefined,
): Promise<ConventionDetail | null> => {
  const existing = await getConventionById(client, id);
  if (!existing) return null;

  const hasFieldChanges = Object.values(input).some((value) => value !== undefined);
  if (hasFieldChanges) {
    await updateConvention(client, id, input);
  }
  if (roleKeys) {
    await replaceConventionRoles(client, id, roleKeys);
  }
  return processGetConventionDetail(client, id);
};
