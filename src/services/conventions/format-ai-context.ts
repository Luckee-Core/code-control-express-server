import type { Convention } from '../../model/convention';
import type { ConventionDomain } from '../../model/convention-domain';
import type { ConventionExample } from '../../model/convention-example';
import type { ConventionTopic } from '../../model/convention-topic';
import type { RepoRole } from '../../model/repo-role';
import type { ConventionVocabulary } from './types';

type FormatAiContextInput = {
  domain: ConventionDomain;
  role: RepoRole;
  topics: ConventionTopic[];
  conventions: Convention[];
  examples: ConventionExample[];
  vocabulary: ConventionVocabulary | null;
  formatVersion: number;
};

const fence = (language: string, code: string): string => ['```' + language, code.trimEnd(), '```'].join('\n');

const formatExample = (example: ConventionExample): string[] => {
  const label = example.kind === 'correct' ? 'Do' : "Don't";
  const where = example.path_hint ? ` (\`${example.path_hint}\`)` : '';
  const lines = [`**${label}: ${example.title}**${where}`, '', fence(example.language, example.code)];
  if (example.note.trim()) lines.push('', example.note.trim());
  return lines;
};

const formatConvention = (convention: Convention, examples: ConventionExample[]): string[] => {
  const lines = [`### [${convention.severity.toUpperCase()}] ${convention.title} (\`${convention.key}\`)`, '', convention.statement.trim()];
  if (convention.rationale.trim()) lines.push('', `Why: ${convention.rationale.trim()}`);
  for (const example of examples) lines.push('', ...formatExample(example));
  return lines;
};

const formatVocabulary = (vocabulary: ConventionVocabulary): string[] => {
  const lines = ['## Vocabulary', '', '### Column types', ''];
  for (const t of vocabulary.column_types.filter((c) => c.is_active)) {
    lines.push(`- \`${t.key}\`: SQL \`${t.sql_type}\`, TS \`${t.ts_type}\`. Use when: ${t.when_to_use}${t.avoid_when ? ` Avoid when: ${t.avoid_when}` : ''}`);
  }
  lines.push('', '### Standard columns (every table)', '');
  for (const c of vocabulary.standard_columns) {
    lines.push(`- \`${c.name} ${c.sql_definition}\` (TS \`${c.ts_type}\`, set by ${c.set_by})${c.description ? `: ${c.description}` : ''}`);
  }
  lines.push('', '### Lifecycle options', '');
  for (const o of vocabulary.lifecycle_options) {
    lines.push(`- \`${o.key}\` (${o.name})${o.columns_sql ? `: columns \`${o.columns_sql}\`` : ''}${o.read_filter ? `; read filter \`${o.read_filter}\`` : ''}. Use when: ${o.when_to_use}`);
  }
  lines.push('', '### Table archetypes', '');
  for (const a of vocabulary.table_archetypes) {
    const examples = a.example_tables.length ? ` Examples: ${a.example_tables.join(', ')}.` : '';
    lines.push(`- \`${a.key}\` (${a.name}): ${a.description}${a.naming_pattern ? ` Naming: \`${a.naming_pattern}\`.` : ''}${examples}`);
  }
  return lines;
};

/**
 * Renders conventions as deterministic markdown for an AI request.
 * No ids or timestamps go in, so the same conventions always produce the same text (and hash).
 * Order follows storage: topic sort_order, then convention sort_order, then key.
 */
export const formatAiContext = (input: FormatAiContextInput): string => {
  const { domain, role, topics, conventions, examples, vocabulary, formatVersion } = input;
  const examplesByConvention = new Map<string, ConventionExample[]>();
  for (const example of examples) {
    const list = examplesByConvention.get(example.convention_id) ?? [];
    list.push(example);
    examplesByConvention.set(example.convention_id, list);
  }

  const lines = [
    `# ${domain.name} conventions for ${role.name}`,
    '',
    `Domain \`${domain.key}\` · Role \`${role.key}\` · ${conventions.length} conventions · Format v${formatVersion}`,
    '',
    'Severity: MUST / NEVER are hard rules; SHOULD / AVOID are strong defaults.',
  ];

  for (const topic of topics.filter((t) => t.domain_key === domain.key)) {
    const inTopic = conventions.filter((c) => c.topic_key === topic.key);
    if (!inTopic.length) continue;
    lines.push('', `## ${topic.name}`);
    if (topic.description.trim()) lines.push('', topic.description.trim());
    for (const convention of inTopic) {
      lines.push('', ...formatConvention(convention, examplesByConvention.get(convention.id) ?? []));
    }
  }

  if (vocabulary) lines.push('', ...formatVocabulary(vocabulary));
  return lines.join('\n') + '\n';
};
