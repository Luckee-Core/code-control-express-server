import { createConventionExample, deleteConventionExample, updateConventionExample } from '../../data/convention-examples';
import { replaceConventionRoles } from '../../data/convention-roles';
import { createConvention, getConventionById, updateConvention } from '../../data/conventions';
import type { ConventionChange, ConventionChangeContext } from '../../model/convention-change';
import type { CanonicalDataClient } from '../canonical-data-client';

const pick = (row: Record<string, unknown> | null, fields: string[]): Record<string, unknown> =>
  Object.fromEntries(fields.filter((field) => row && field in row).map((field) => [field, row![field]]));

const CONVENTION_FIELDS = ['topic_key', 'title', 'statement', 'rationale', 'severity', 'status', 'check_kind', 'check_config', 'sort_order'];
const EXAMPLE_FIELDS = ['title', 'kind', 'language', 'path_hint', 'code', 'note', 'sort_order'];

/**
 * Undoes one applied ledger change with a new change (source template_agent), using its
 * before/after rows. A created convention is deprecated rather than deleted, so history stays.
 * Returns a note when it could not be reverted.
 */
export const revertConventionChange = async (client: CanonicalDataClient, change: ConventionChange, context: ConventionChangeContext): Promise<string | null> => {
  const before = change.before as Record<string, unknown> | null;
  const after = change.after as Record<string, unknown> | null;
  const conventionId = change.convention_id;
  if (change.change_type !== 'delete' && conventionId && !(await getConventionById(client, conventionId))) {
    return `${change.convention_key}: convention no longer exists`;
  }

  switch (change.change_type) {
    case 'create':
      await updateConvention(client, conventionId!, { status: 'deprecated' }, context);
      return null;
    case 'refine':
    case 'deprecate':
    case 'activate':
    case 'status_change':
    case 'severity_change':
    case 'check_change':
    case 'reorder': {
      const fields = change.changed_fields.length > 0 ? change.changed_fields.filter((field) => CONVENTION_FIELDS.includes(field)) : CONVENTION_FIELDS;
      await updateConvention(client, conventionId!, pick(before, fields), context);
      return null;
    }
    case 'role_change':
      await replaceConventionRoles(client, conventionId!, ((before?.role_keys as string[] | undefined) ?? []), context);
      return null;
    case 'example_add':
      if (!after?.id) return `${change.convention_key}: example id unknown`;
      await deleteConventionExample(client, String(after.id), context);
      return null;
    case 'example_update':
      if (!after?.id) return `${change.convention_key}: example id unknown`;
      await updateConventionExample(client, String(after.id), pick(before, change.changed_fields.length > 0 ? change.changed_fields : EXAMPLE_FIELDS) as never, context);
      return null;
    case 'example_remove':
      if (!before) return `${change.convention_key}: removed example unknown`;
      await createConventionExample(client, { convention_id: String(before.convention_id), ...(pick(before, EXAMPLE_FIELDS) as Record<string, unknown>) } as never, context);
      return null;
    case 'delete':
      if (!before) return `${change.convention_key}: deleted convention unknown`;
      await createConvention(client, { ...pick(before, ['key', 'domain_key', ...CONVENTION_FIELDS]), role_keys: change.role_keys } as never, context);
      return null;
  }
};
