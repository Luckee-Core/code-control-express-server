import { replaceConventionRoles } from '../../data/convention-roles';
import { createConvention } from '../../data/conventions';
import type { CreateConventionInput } from '../../model/convention';
import type { ConventionChangeContext } from '../../model/convention-change';
import type { CanonicalDataClient } from '../canonical-data-client';
import { processGetConventionDetail } from './process-get-convention-detail';
import type { ConventionDetail } from './types';
import { scheduleTemplateSync } from '../agent-runs/sync-template-drafts';

/**
 * Creates a convention with its repo roles; storage links the roles and writes the ledger's
 * create row in one transaction.
 */
export const processCreateConvention = async (
  client: CanonicalDataClient,
  input: CreateConventionInput,
  roleKeys: string[] | undefined,
  change: ConventionChangeContext = {},
): Promise<ConventionDetail> => {
  const convention = await createConvention(client, { ...input, role_keys: roleKeys ?? [] }, change);
  let detail = await processGetConventionDetail(client, convention.id);
  if (!detail) throw new Error('Convention disappeared after create');

  // Storage older than migration 106 ignores input.role_keys: link the roles separately.
  if (roleKeys && roleKeys.length > 0 && detail.role_keys.length === 0) {
    await replaceConventionRoles(client, convention.id, roleKeys, change);
    detail = await processGetConventionDetail(client, convention.id);
    if (!detail) throw new Error('Convention disappeared after create');
  }
  scheduleTemplateSync(client);
  return detail;
};
