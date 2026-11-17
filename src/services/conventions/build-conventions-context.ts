import { createHash } from 'crypto';
import { SEVERITY_LABELS } from './config';
import type { ConventionsContext, ConventionsContextSnapshot } from './types';

const fence = (language: string, code: string): string => {
  const lang = language === 'text' ? '' : language;
  return ['```' + lang, code.trimEnd(), '```'].join('\n');
};

const cell = (value: string): string => value.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

/**
 * Renders a conventions snapshot as markdown for an AI system prompt.
 * Pure and deterministic: the same snapshot always yields byte-identical text (prompt-cache friendly).
 */
export const buildConventionsContext = (snapshot: ConventionsContextSnapshot): ConventionsContext => {
  const lines: string[] = [];
  const scope = snapshot.role_key ? `${snapshot.domain_key} · ${snapshot.role_key} repo` : snapshot.domain_key;

  lines.push(`# Luckee coding conventions (${scope})`);
  lines.push('');
  lines.push(
    'These are the house rules for every Luckee project. MUST and NEVER are hard rules; SHOULD and AVOID are strong defaults that need a stated reason to break. Each rule has a stable key; cite keys when explaining a choice.',
  );

  for (const topic of snapshot.topics) {
    const rules = snapshot.conventions.filter((convention) => convention.topic_key === topic.key);
    if (rules.length === 0) continue;
    lines.push('');
    lines.push(`## ${topic.name}`);
    if (topic.description) lines.push(topic.description);
    for (const rule of rules) {
      lines.push('');
      lines.push(`### [${SEVERITY_LABELS[rule.severity]}] ${rule.title} \`${rule.key}\``);
      lines.push(rule.statement);
      if (rule.rationale) lines.push(`Why: ${rule.rationale}`);
      for (const example of rule.examples) {
        const label = example.kind === 'correct' ? '✅ Correct' : '❌ Incorrect';
        const where = example.path_hint ? ` (\`${example.path_hint}\`)` : '';
        lines.push('');
        lines.push(`${label}: ${example.title}${where}`);
        lines.push(fence(example.language, example.code));
        if (example.note) lines.push(example.note);
      }
    }
  }

  if (snapshot.standard_columns.length > 0) {
    lines.push('');
    lines.push('## Standard columns (added to every table by code — never list them yourself)');
    lines.push('');
    lines.push('| column | definition | set by |');
    lines.push('|---|---|---|');
    for (const column of snapshot.standard_columns) {
      lines.push(`| ${column.name} | \`${cell(column.sql_definition)}\` | ${column.set_by} |`);
    }
  }

  if (snapshot.column_types.length > 0) {
    lines.push('');
    lines.push('## Column type vocabulary (the only allowed column types)');
    lines.push('');
    lines.push('| type | SQL | TypeScript | use when | avoid when |');
    lines.push('|---|---|---|---|---|');
    for (const type of snapshot.column_types) {
      lines.push(
        `| ${type.key} | \`${cell(type.sql_type)}\` | \`${cell(type.ts_type)}\` | ${cell(type.when_to_use)} | ${cell(type.avoid_when)} |`,
      );
    }
  }

  if (snapshot.lifecycle_options.length > 0) {
    lines.push('');
    lines.push('## Lifecycle options (pick one per table)');
    lines.push('');
    lines.push('| lifecycle | columns | read filter | when to use |');
    lines.push('|---|---|---|---|');
    for (const option of snapshot.lifecycle_options) {
      lines.push(
        `| ${option.key} | ${option.columns_sql ? `\`${cell(option.columns_sql)}\`` : '—'} | ${option.read_filter ? `\`${cell(option.read_filter)}\`` : '—'} | ${cell(option.when_to_use)} |`,
      );
    }
  }

  if (snapshot.table_archetypes.length > 0) {
    lines.push('');
    lines.push('## Table archetypes (reuse these shapes)');
    for (const archetype of snapshot.table_archetypes) {
      lines.push('');
      lines.push(`### ${archetype.name} \`${archetype.key}\``);
      lines.push(archetype.description);
      if (archetype.naming_pattern) lines.push(`Naming: ${archetype.naming_pattern}`);
      if (archetype.when_to_use) lines.push(`Use when: ${archetype.when_to_use}`);
      if (Array.isArray(archetype.required_columns) && archetype.required_columns.length > 0) {
        lines.push(`Required: ${JSON.stringify(archetype.required_columns)}`);
      }
      if (archetype.example_tables.length > 0) lines.push(`Examples: ${archetype.example_tables.join(', ')}`);
    }
  }

  const text = `${lines.join('\n')}\n`;
  return {
    domain_key: snapshot.domain_key,
    role_key: snapshot.role_key,
    text,
    hash: createHash('sha256').update(text).digest('hex'),
    convention_count: snapshot.conventions.length,
    snapshot,
  };
};
