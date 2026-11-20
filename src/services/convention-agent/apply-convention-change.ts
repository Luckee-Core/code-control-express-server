import { createConventionExample } from '../../data/convention-examples';
import { replaceConventionRoles } from '../../data/convention-roles';
import { createConvention, updateConvention } from '../../data/conventions';
import type { ConventionChange, ConventionChangeContext } from '../../model/convention-change';
import type { ConventionExampleKind, ConventionExampleLanguage } from '../../model/convention-example';
import type { CanonicalDataClient } from '../canonical-data-client';
import { updateFieldsOf } from './normalize-convention-change';

type ExampleFields = { title: string; kind: ConventionExampleKind; language: ConventionExampleLanguage; path_hint: string | null; code: string; note: string };

/**
 * Applies one proposed ledger row through the normal convention writers. The writer finalizes the
 * proposed row (proposed → applied) in the same transaction as the change, so it can't run twice.
 */
export const applyConventionChange = async (client: CanonicalDataClient, row: ConventionChange): Promise<void> => {
  const context: ConventionChangeContext = { source_type: row.source_type, source_id: row.source_id, proposed_change_id: row.id };
  const after = (row.after ?? {}) as Record<string, unknown>;

  switch (row.change_type) {
    case 'create': {
      const convention = await createConvention(
        client,
        {
          key: row.convention_key,
          domain_key: String(after.domain_key),
          topic_key: String(after.topic_key),
          title: String(after.title),
          statement: String(after.statement),
          rationale: String(after.rationale ?? ''),
          severity: after.severity as never,
          status: (after.status as never) ?? 'active',
          role_keys: (after.role_keys as string[] | undefined) ?? [],
        },
        context,
      );
      // Examples are their own ledger rows (applied, same source), not part of the proposal.
      for (const example of (after.examples as ExampleFields[] | undefined) ?? []) {
        await createConventionExample(client, { convention_id: convention.id, ...example }, { source_type: row.source_type, source_id: row.source_id });
      }
      return;
    }
    case 'refine':
    case 'deprecate':
    case 'activate':
    case 'severity_change':
    case 'status_change':
    case 'check_change':
    case 'reorder':
      if (!row.convention_id) throw new Error(`${row.convention_key}: proposal has no convention id`);
      await updateConvention(client, row.convention_id, updateFieldsOf(after), context);
      return;
    case 'role_change':
      if (!row.convention_id) throw new Error(`${row.convention_key}: proposal has no convention id`);
      await replaceConventionRoles(client, row.convention_id, (after.role_keys as string[] | undefined) ?? [], context);
      return;
    case 'example_add':
      if (!row.convention_id) throw new Error(`${row.convention_key}: proposal has no convention id`);
      await createConventionExample(client, { convention_id: row.convention_id, ...(after as unknown as ExampleFields) }, context);
      return;
    default:
      throw new Error(`${row.convention_key}: can't apply ${row.change_type} from a proposal`);
  }
};
