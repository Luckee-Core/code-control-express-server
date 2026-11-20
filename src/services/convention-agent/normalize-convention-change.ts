import type { ConventionChange, ProposedConventionChangeInput } from '../../model/convention-change';
import type { ConventionAgentChange } from './convention-agent-schema';
import type { ConventionCatalog } from './convention-catalog';

const UPDATE_FIELDS = ['topic_key', 'title', 'statement', 'rationale', 'severity', 'status', 'check_kind', 'check_config', 'sort_order'] as const;

const exampleFrom = (change: ConventionAgentChange) => ({
  title: change.example.title.trim(),
  kind: change.example.kind,
  language: change.example.language,
  path_hint: change.example.path_hint.trim() || null,
  code: change.example.code,
  note: change.example.note.trim(),
});

/**
 * Turns one AI change into a proposed ledger row: `after` is exactly what applying it writes,
 * `before` the current values of those fields (null for a create).
 */
export const normalizeConventionChange = (
  change: ConventionAgentChange,
  catalog: ConventionCatalog,
  source: { source_id: string },
): ProposedConventionChangeInput => {
  const key = change.convention_key.trim();
  const existing = catalog.byKey.get(key) ?? null;
  const base = {
    convention_id: change.change_type === 'create' ? null : existing?.id ?? null,
    convention_key: key,
    domain_key: change.change_type === 'create' ? change.domain_key : existing?.domain_key ?? change.domain_key,
    reason: change.reason.trim(),
    verdict: change.verdict,
    cited_key: change.cited_key.trim() || null,
    source_type: 'convention_agent' as const,
    source_id: source.source_id,
  };

  if (change.change_type === 'create') {
    return {
      ...base,
      change_type: 'create',
      role_keys: [...new Set(change.role_keys)].sort(),
      before: null,
      after: {
        key,
        domain_key: change.domain_key,
        topic_key: change.topic_key,
        title: change.title.trim(),
        statement: change.statement.trim(),
        rationale: change.rationale.trim(),
        severity: change.severity || 'should',
        status: 'active',
        role_keys: [...new Set(change.role_keys)].sort(),
        examples: change.example.include ? [exampleFrom(change)] : [],
      },
    };
  }

  const roleKeys = existing?.role_keys ?? [];
  const pickBefore = (fields: string[]): Record<string, unknown> | null =>
    existing ? Object.fromEntries(fields.map((field) => [field, (existing as unknown as Record<string, unknown>)[field] ?? null])) : null;

  switch (change.change_type) {
    case 'refine': {
      const after: Record<string, unknown> = {};
      if (change.title.trim()) after.title = change.title.trim();
      if (change.statement.trim()) after.statement = change.statement.trim();
      if (change.rationale.trim()) after.rationale = change.rationale.trim();
      if (change.topic_key && change.topic_key !== existing?.topic_key) after.topic_key = change.topic_key;
      return { ...base, change_type: 'refine', role_keys: roleKeys, before: pickBefore(Object.keys(after)), after };
    }
    case 'deprecate':
      return { ...base, change_type: 'deprecate', role_keys: roleKeys, before: pickBefore(['status']), after: { status: 'deprecated' } };
    case 'activate':
      return { ...base, change_type: 'activate', role_keys: roleKeys, before: pickBefore(['status']), after: { status: 'active' } };
    case 'severity_change':
      return { ...base, change_type: 'severity_change', role_keys: roleKeys, before: pickBefore(['severity']), after: { severity: change.severity } };
    case 'role_change':
      return {
        ...base,
        change_type: 'role_change',
        role_keys: roleKeys,
        before: { role_keys: roleKeys },
        after: { role_keys: [...new Set(change.role_keys)].sort() },
      };
    case 'example_add':
      return { ...base, change_type: 'example_add', role_keys: roleKeys, before: null, after: exampleFrom(change) };
  }
};

/** Fields of `after` that an update-type change writes to the conventions row. */
export const updateFieldsOf = (after: Record<string, unknown> | null): Record<string, unknown> =>
  Object.fromEntries(Object.entries(after ?? {}).filter(([field]) => (UPDATE_FIELDS as readonly string[]).includes(field)));

/** A stored proposed row in the shape validation expects. */
export type ProposedRow = Pick<ConventionChange, 'id' | 'change_type' | 'convention_id' | 'convention_key' | 'domain_key' | 'after' | 'cited_key'>;
