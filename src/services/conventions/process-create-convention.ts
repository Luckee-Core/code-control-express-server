import { replaceConventionRoles } from '../../data/convention-roles';
import { createConvention } from '../../data/conventions';
import type { CreateConventionInput } from '../../model/convention';
import type { CanonicalDataClient } from '../canonical-data-client';
import { processGetConventionDetail } from './process-get-convention-detail';
import type { ConventionDetail } from './types';

/**
 * Creates a convention and links its repo roles.
 */
export const processCreateConvention = async (
  client: CanonicalDataClient,
  input: CreateConventionInput,
  roleKeys: string[] | undefined,
): Promise<ConventionDetail> => {
  const convention = await createConvention(client, input);
  if (roleKeys && roleKeys.length > 0) {
    await replaceConventionRoles(client, convention.id, roleKeys);
  }
  const detail = await processGetConventionDetail(client, convention.id);
  if (!detail) throw new Error('Convention disappeared after create');
  return detail;
};
