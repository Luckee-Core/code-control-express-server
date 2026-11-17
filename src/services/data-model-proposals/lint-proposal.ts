import type {
  DataModelProposalContent,
  ProposalWarning,
  ProposedColumn,
  ProposedTable,
} from '../../model/data-model-proposal';
import type { DataModelVocabulary, ProposalRuleConvention } from './types';

type RuleContext = {
  proposal: DataModelProposalContent;
  vocabulary: DataModelVocabulary;
  config: Record<string, unknown>;
};

type Finding = { table: string; column?: string; message: string };

type Rule = (context: RuleContext) => Finding[];

const SNAKE = /^[a-z][a-z0-9_]*$/;
const PLURAL_EXCEPTIONS = new Set(['data', 'media', 'staff', 'feedback', 'info', 'metadata', 'people', 'children']);
const NON_MONEY_SUFFIXES = ['_count', '_tokens', '_ms', '_seconds', '_minutes', '_percent', '_pct', '_bps'];

const configList = (config: Record<string, unknown>, key: string): string[] => {
  const value = config[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
};

const tokens = (name: string): string[] => name.split('_').filter(Boolean);

const matchesPattern = (name: string, pattern: string): boolean =>
  pattern.includes('_') ? name.includes(pattern) : tokens(name).includes(pattern);

const eachColumn = (
  proposal: DataModelProposalContent,
  check: (table: ProposedTable, column: ProposedColumn) => string | null,
): Finding[] => {
  const findings: Finding[] = [];
  for (const table of proposal.tables) {
    for (const column of table.columns) {
      const message = check(table, column);
      if (message) findings.push({ table: table.name, column: column.name, message });
    }
  }
  return findings;
};

const eachTable = (
  proposal: DataModelProposalContent,
  check: (table: ProposedTable) => string | null,
): Finding[] =>
  proposal.tables.flatMap((table) => {
    const message = check(table);
    return message ? [{ table: table.name, message }] : [];
  });

/** Rule implementations keyed by conventions.check_config.rule. */
const RULES: Record<string, Rule> = {
  table_name_snake_plural: ({ proposal }) =>
    eachTable(proposal, (table) => {
      if (!SNAKE.test(table.name)) return 'Table name must be snake_case';
      const last = tokens(table.name).pop() ?? '';
      if (!last.endsWith('s') && !PLURAL_EXCEPTIONS.has(last)) return 'Table name should be plural';
      return null;
    }),

  no_standard_columns_in_proposal: ({ proposal, config }) => {
    const names = new Set(configList(config, 'columns'));
    return eachColumn(proposal, (_table, column) =>
      names.has(column.name) ? 'Standard columns are added automatically; do not list them' : null,
    );
  },

  excluded_table_categories: ({ proposal, config }) => {
    const patterns = configList(config, 'patterns');
    const allowed = new Set(configList(config, 'allow_archetypes'));
    return eachTable(proposal, (table) => {
      if (allowed.has(table.archetype)) return null;
      const hit = patterns.find((pattern) => matchesPattern(table.name, pattern));
      return hit ? `Looks like a "${hit}" table; propose only what the core workflow needs` : null;
    });
  },

  no_users_table: ({ proposal, config }) => {
    const patterns = new Set(configList(config, 'patterns'));
    return eachTable(proposal, (table) =>
      patterns.has(table.name) ? 'Auth/user tables are not part of the core data model' : null,
    );
  },

  enum_values_required: ({ proposal }) =>
    eachColumn(proposal, (_table, column) =>
      column.type === 'enum' && column.enum_values.length === 0 ? 'Enum column must list its allowed values' : null,
    ),

  money_columns_cents: ({ proposal, config }) => {
    const patterns = configList(config, 'name_patterns');
    return eachColumn(proposal, (_table, column) => {
      if (!['integer', 'numeric', 'cents'].includes(column.type)) return null;
      if (NON_MONEY_SUFFIXES.some((suffix) => column.name.endsWith(suffix))) return null;
      const looksLikeMoney = column.type === 'cents' || patterns.some((pattern) => matchesPattern(column.name, pattern));
      if (!looksLikeMoney) return null;
      if (column.type !== 'cents' || !column.name.endsWith('_cents')) {
        return 'Money must be type cents with a _cents suffix';
      }
      return null;
    });
  },

  boolean_prefix: ({ proposal, config }) => {
    const prefixes = configList(config, 'prefixes');
    return eachColumn(proposal, (_table, column) =>
      column.type === 'boolean' && !prefixes.some((prefix) => column.name.startsWith(prefix))
        ? `Boolean columns start with ${prefixes.join(' or ')}`
        : null,
    );
  },

  ordering_column_name: ({ proposal, config }) => {
    const disallowed = new Set(configList(config, 'disallowed'));
    const allowed = typeof config.allowed === 'string' ? config.allowed : 'sort_order';
    return eachColumn(proposal, (_table, column) =>
      disallowed.has(column.name) ? `Use ${allowed} for ordering` : null,
    );
  },

  jsonb_not_filtered: ({ proposal }) =>
    eachColumn(proposal, (_table, column) =>
      column.type === 'jsonb' && (column.is_indexed || column.is_unique)
        ? 'jsonb is for payloads/snapshots; promote filtered fields to real columns'
        : null,
    ),

  fk_column_suffix_id: ({ proposal }) =>
    eachColumn(proposal, (_table, column) =>
      column.references_table && !column.name.endsWith('_id') ? 'Foreign key columns end in _id' : null,
    ),

  column_type_in_vocabulary: ({ proposal, vocabulary }) => {
    const allowed = new Set(vocabulary.column_type_keys);
    return eachColumn(proposal, (_table, column) =>
      allowed.has(column.type) ? null : `Unknown column type "${column.type}"`,
    );
  },

  fk_on_delete_required: ({ proposal }) =>
    eachColumn(proposal, (_table, column) =>
      column.references_table && column.on_delete === 'none' ? 'Foreign key needs an on_delete rule' : null,
    ),

  external_reference_no_fk: ({ proposal, config }) => {
    const names = new Set(configList(config, 'columns'));
    const tableNames = new Set(proposal.tables.map((table) => table.name));
    return eachColumn(proposal, (_table, column) =>
      names.has(column.name) && column.references_table && !tableNames.has(column.references_table)
        ? 'References to other systems are plain uuid columns with no foreign key'
        : null,
    );
  },

  fk_target_exists: ({ proposal }) => {
    const tableNames = new Set(proposal.tables.map((table) => table.name));
    return eachColumn(proposal, (_table, column) =>
      column.references_table && !tableNames.has(column.references_table)
        ? `References "${column.references_table}", which is not in this proposal`
        : null,
    );
  },

  lifecycle_in_options: ({ proposal, vocabulary }) => {
    const allowed = new Set(vocabulary.lifecycle_keys);
    return eachTable(proposal, (table) => (allowed.has(table.lifecycle) ? null : `Unknown lifecycle "${table.lifecycle}"`));
  },

  archetype_in_list: ({ proposal, vocabulary }) => {
    const allowed = new Set(vocabulary.archetype_keys);
    return eachTable(proposal, (table) => (allowed.has(table.archetype) ? null : `Unknown archetype "${table.archetype}"`));
  },
};

/**
 * Checks a normalized proposal against every active `check_kind = proposal` convention.
 * MUST/NEVER rules produce errors; SHOULD/AVOID produce warnings. Unknown rule names are skipped,
 * so new conventions can be seeded before their check exists.
 */
export const lintProposal = (
  proposal: DataModelProposalContent,
  conventions: ProposalRuleConvention[],
  vocabulary: DataModelVocabulary,
): ProposalWarning[] => {
  const warnings: ProposalWarning[] = [];
  for (const convention of conventions) {
    const config = convention.check_config ?? {};
    const ruleName = typeof config.rule === 'string' ? config.rule : '';
    const rule = RULES[ruleName];
    if (!rule) continue;
    const severity = convention.severity === 'must' || convention.severity === 'never' ? 'error' : 'warning';
    for (const finding of rule({ proposal, vocabulary, config })) {
      warnings.push({
        code: ruleName,
        severity,
        table: finding.table,
        column: finding.column ?? '',
        message: finding.message,
        convention_key: convention.key,
      });
    }
  }
  return warnings;
};
