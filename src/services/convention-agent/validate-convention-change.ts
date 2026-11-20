import { CONVENTION_KEY_PATTERN, CONVENTION_SEVERITIES, EXAMPLE_KINDS, EXAMPLE_LANGUAGES } from '../conventions/config';
import type { ConventionCatalog } from './convention-catalog';
import { updateFieldsOf, type ProposedRow } from './normalize-convention-change';

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const validateExample = (example: Record<string, unknown>, label: string): string[] => {
  const errors: string[] = [];
  if (!isText(example.title)) errors.push(`${label}: example needs a title`);
  if (!isText(example.code)) errors.push(`${label}: example needs code`);
  if (!EXAMPLE_KINDS.includes(example.kind as never)) errors.push(`${label}: example kind must be correct or incorrect`);
  if (!EXAMPLE_LANGUAGES.includes(example.language as never)) errors.push(`${label}: unknown example language`);
  return errors;
};

/**
 * Problems that would stop a proposed change from applying cleanly against today's catalog
 * ([] = valid). `otherCreateKeys` are keys created by other rows in the same batch.
 */
export const validateConventionChange = (row: ProposedRow, catalog: ConventionCatalog, otherCreateKeys: Set<string> = new Set()): string[] => {
  const errors: string[] = [];
  const label = row.convention_key || '(no key)';
  const after = row.after ?? {};
  const roleKeys = new Set(catalog.roles.map((role) => role.key));
  const existing = catalog.byKey.get(row.convention_key);

  if (row.cited_key && !catalog.byKey.has(row.cited_key)) errors.push(`${label}: cites unknown convention ${row.cited_key}`);

  if (row.change_type === 'create') {
    if (!CONVENTION_KEY_PATTERN.test(row.convention_key)) errors.push(`${label}: key must be dotted lowercase (e.g. api.svc.validate_input)`);
    if (existing) errors.push(`${label}: a convention with this key already exists`);
    if (otherCreateKeys.has(row.convention_key)) errors.push(`${label}: proposed twice in this run`);
    const domain = String(after.domain_key ?? '');
    const topic = catalog.topics.find((item) => item.key === after.topic_key);
    if (!catalog.domains.some((item) => item.key === domain)) errors.push(`${label}: unknown domain ${domain}`);
    if (!topic) errors.push(`${label}: unknown topic ${String(after.topic_key ?? '')}`);
    else if (topic.domain_key !== domain) errors.push(`${label}: topic ${topic.key} belongs to ${topic.domain_key}, not ${domain}`);
    if (!isText(after.title)) errors.push(`${label}: title is required`);
    if (!isText(after.statement)) errors.push(`${label}: statement is required`);
    if (!CONVENTION_SEVERITIES.includes(after.severity as never)) errors.push(`${label}: severity must be one of ${CONVENTION_SEVERITIES.join(', ')}`);
    for (const role of (after.role_keys as string[] | undefined) ?? []) if (!roleKeys.has(role)) errors.push(`${label}: unknown repo role ${role}`);
    for (const example of (after.examples as Array<Record<string, unknown>> | undefined) ?? []) errors.push(...validateExample(example, label));
    return errors;
  }

  if (!existing) {
    errors.push(`${label}: no convention with this key`);
    return errors;
  }
  switch (row.change_type) {
    case 'refine': {
      const fields = updateFieldsOf(after);
      if (Object.keys(fields).length === 0) errors.push(`${label}: refine changes nothing`);
      if ('topic_key' in fields) {
        const topic = catalog.topics.find((item) => item.key === fields.topic_key);
        if (!topic || topic.domain_key !== existing.domain_key) errors.push(`${label}: topic must belong to ${existing.domain_key}`);
      }
      for (const field of ['title', 'statement'] as const) if (field in fields && !isText(fields[field])) errors.push(`${label}: ${field} can't be empty`);
      break;
    }
    case 'severity_change':
      if (!CONVENTION_SEVERITIES.includes(after.severity as never)) errors.push(`${label}: severity must be one of ${CONVENTION_SEVERITIES.join(', ')}`);
      else if (after.severity === existing.severity) errors.push(`${label}: severity is already ${existing.severity}`);
      break;
    case 'deprecate':
      if (existing.status === 'deprecated') errors.push(`${label}: already deprecated`);
      break;
    case 'activate':
      if (existing.status === 'active') errors.push(`${label}: already active`);
      break;
    case 'role_change':
      for (const role of (after.role_keys as string[] | undefined) ?? []) if (!roleKeys.has(role)) errors.push(`${label}: unknown repo role ${role}`);
      break;
    case 'example_add':
      errors.push(...validateExample(after, label));
      break;
    default:
      errors.push(`${label}: ${row.change_type} can't be proposed by the convention agent`);
  }
  return errors;
};
