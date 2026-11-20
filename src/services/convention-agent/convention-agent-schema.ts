import { CONVENTION_SEVERITIES, EXAMPLE_KINDS, EXAMPLE_LANGUAGES } from '../conventions/config';

/** Change types the convention agent may propose. */
export const PROPOSABLE_CHANGE_TYPES = ['create', 'refine', 'deprecate', 'activate', 'severity_change', 'role_change', 'example_add'] as const;
export type ProposableChangeType = (typeof PROPOSABLE_CHANGE_TYPES)[number];

export const VERDICTS = ['new', 'refines', 'conflicts', 'duplicate', 'wrong_scope'] as const;

export type ConventionAgentExample = {
  include: boolean;
  title: string;
  kind: 'correct' | 'incorrect';
  language: 'sql' | 'ts' | 'tsx' | 'json' | 'text';
  path_hint: string;
  code: string;
  note: string;
};

export type ConventionAgentChange = {
  change_type: ProposableChangeType;
  convention_key: string;
  verdict: (typeof VERDICTS)[number];
  cited_key: string;
  reason: string;
  domain_key: string;
  topic_key: string;
  title: string;
  statement: string;
  rationale: string;
  severity: string;
  role_keys: string[];
  example: ConventionAgentExample;
};

export type ConventionAgentAnswer = {
  summary: string;
  decision: 'no_change' | 'changes';
  no_change_reason: string;
  changes: ConventionAgentChange[];
};

/** JSON Schema for the convention agent's answer (every key required; '' / [] mean "not used"). */
export const buildConventionAgentSchema = (input: { domainKeys: string[]; topicKeys: string[]; roleKeys: string[] }): Record<string, unknown> => ({
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'decision', 'no_change_reason', 'changes'],
  properties: {
    summary: { type: 'string', description: 'What the feedback means for the conventions, in 1-3 sentences.' },
    decision: { type: 'string', enum: ['no_change', 'changes'] },
    no_change_reason: { type: 'string', description: "Why no convention change is needed (cite keys). '' when decision is changes." },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['change_type', 'convention_key', 'verdict', 'cited_key', 'reason', 'domain_key', 'topic_key', 'title', 'statement', 'rationale', 'severity', 'role_keys', 'example'],
        properties: {
          change_type: { type: 'string', enum: [...PROPOSABLE_CHANGE_TYPES] },
          convention_key: { type: 'string', description: 'Existing key for changes; a new dotted lowercase key for create.' },
          verdict: { type: 'string', enum: [...VERDICTS], description: 'How this compares with the existing catalog.' },
          cited_key: { type: 'string', description: "The existing convention this overlaps, refines or conflicts with; '' when none." },
          reason: { type: 'string', description: 'Why, tied to the feedback and the PR change.' },
          domain_key: { type: 'string', enum: input.domainKeys },
          topic_key: { type: 'string', enum: ['', ...input.topicKeys], description: "Required for create; '' otherwise unless moving topics." },
          title: { type: 'string', description: "create: required. refine: new title or '' to keep." },
          statement: { type: 'string', description: "create: required. refine: new statement or '' to keep." },
          rationale: { type: 'string', description: "Why the rule exists; '' to keep." },
          severity: { type: 'string', enum: ['', ...CONVENTION_SEVERITIES], description: "create / severity_change: required. '' otherwise." },
          role_keys: { type: 'array', items: { type: 'string', enum: input.roleKeys }, description: 'create / role_change: the repo roles. [] otherwise.' },
          example: {
            type: 'object',
            additionalProperties: false,
            required: ['include', 'title', 'kind', 'language', 'path_hint', 'code', 'note'],
            properties: {
              include: { type: 'boolean', description: 'true to add this example (required for example_add; optional for create).' },
              title: { type: 'string' },
              kind: { type: 'string', enum: [...EXAMPLE_KINDS] },
              language: { type: 'string', enum: [...EXAMPLE_LANGUAGES] },
              path_hint: { type: 'string' },
              code: { type: 'string' },
              note: { type: 'string' },
            },
          },
        },
      },
    },
  },
});
