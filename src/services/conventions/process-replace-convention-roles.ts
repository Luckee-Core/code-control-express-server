import { replaceConventionRoles } from '../../data/convention-roles';
import type { ConventionChangeContext } from '../../model/convention-change';
import type { ConventionRole } from '../../model/convention-role';
import type { CanonicalDataClient } from '../canonical-data-client';
import { scheduleTemplateSync } from '../agent-runs/sync-template-drafts';

/**
 * Replaces a convention's roles for PUT /api/data/conventions/:id/roles (role_change ledger row
 * when the set changes).
 */
export const processReplaceConventionRoles = async (
  client: CanonicalDataClient,
  conventionId: string,
  roleKeys: string[],
  change: ConventionChangeContext = {},
): Promise<ConventionRole[]> => {
  const roles = await replaceConventionRoles(client, conventionId, roleKeys, change);
  scheduleTemplateSync(client);
  return roles;
};
