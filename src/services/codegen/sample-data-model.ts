import type { DataModelProposalContent, ProposedColumn, ProposedTable } from '../../model/data-model-proposal';

const col = (overrides: Partial<ProposedColumn> & { name: string; type: string }): ProposedColumn => ({
  nullable: true,
  default_sql: '',
  enum_values: [],
  references_table: '',
  on_delete: 'none',
  is_unique: false,
  is_indexed: false,
  description: '',
  ...overrides,
});

const table = (overrides: Partial<ProposedTable> & { name: string; entity: string; columns: ProposedColumn[] }): ProposedTable => ({
  archetype: 'entity',
  lifecycle: 'hard_delete',
  purpose: '',
  why_needed: '',
  ...overrides,
});

/**
 * Sample approved data models covering FKs, enums, sort_order, DATE/JSONB mappers, every lifecycle,
 * quotes and odd names. Used for template render previews and the codegen parity check.
 */
export const SAMPLE_DATA_MODELS: Array<{ version: number; content: DataModelProposalContent }> = [
  {
    version: 3,
    content: {
      summary: '',
      excluded: [],
      open_questions: [],
      tables: [
        table({
          name: 'business_facts',
          entity: 'business-fact',
          lifecycle: 'is_active',
          purpose: "Facts about the business, e.g. 'hours'. Multi\nline */ purpose.",
          columns: [
            col({ name: 'title', type: 'text', nullable: false, description: 'Short */ label' }),
            col({ name: 'kind', type: 'enum', nullable: false, enum_values: ['hours', "owner's note"], default_sql: "'hours'" }),
            col({ name: 'sort_order', type: 'integer', nullable: false, default_sql: '0' }),
            col({ name: 'details', type: 'jsonb' }),
          ],
        }),
        table({
          name: 'fact_sources',
          entity: 'fact-source',
          lifecycle: 'deleted_at',
          purpose: 'Where a fact came from.',
          columns: [
            col({ name: 'business_fact_id', type: 'uuid', nullable: false, references_table: 'business_facts', on_delete: 'cascade' }),
            col({ name: 'url', type: 'text', is_unique: true }),
            col({ name: 'captured_on', type: 'date' }),
            col({ name: 'amount_cents', type: 'cents', is_indexed: true }),
            col({ name: 'tags', type: 'text_array' }),
          ],
        }),
        table({
          name: 's3_files',
          entity: 's3-file',
          lifecycle: 'status_enum',
          columns: [
            col({ name: 'fact_source_id', type: 'uuid', references_table: 'fact_sources', on_delete: 'set_null' }),
            col({ name: 'owner_id', type: 'uuid', nullable: false, references_table: 'business_facts', on_delete: 'restrict' }),
            col({ name: 'bad_default', type: 'text', default_sql: "'x'; DROP TABLE y" }),
            col({ name: 'happened_at', type: 'timestamptz' }),
            col({ name: 'flag', type: 'boolean' }),
          ],
        }),
      ],
    },
  },
  {
    version: 1,
    content: {
      summary: '',
      excluded: [],
      open_questions: [],
      tables: [table({ name: 'notes', entity: 'note', columns: [col({ name: 'body', type: 'text' })] })],
    },
  },
];
