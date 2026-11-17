import type { DataModelVocabulary } from './types';

const stringArray = { type: 'array', items: { type: 'string' } };

/**
 * JSON Schema for the AI's structured output. Column types, lifecycles and archetypes are
 * enums built from the seeded vocabulary tables, so the model cannot invent new ones.
 * Every object sets `additionalProperties: false` and lists all keys as required.
 */
export const buildProposalSchema = (vocabulary: DataModelVocabulary): Record<string, unknown> => {
  const column = {
    type: 'object',
    additionalProperties: false,
    required: [
      'name',
      'type',
      'nullable',
      'default_sql',
      'enum_values',
      'references_table',
      'on_delete',
      'is_unique',
      'is_indexed',
      'description',
    ],
    properties: {
      name: { type: 'string', description: 'snake_case column name' },
      type: { type: 'string', enum: vocabulary.column_type_keys },
      nullable: { type: 'boolean' },
      default_sql: { type: 'string', description: "SQL default expression, '' when none" },
      enum_values: { ...stringArray, description: 'Allowed values when type is enum; [] otherwise' },
      references_table: { type: 'string', description: "Proposed table this column references, '' when none" },
      on_delete: { type: 'string', enum: ['none', 'cascade', 'set_null', 'restrict'] },
      is_unique: { type: 'boolean' },
      is_indexed: { type: 'boolean' },
      description: { type: 'string' },
    },
  };

  const table = {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'entity', 'archetype', 'lifecycle', 'purpose', 'why_needed', 'columns'],
    properties: {
      name: { type: 'string', description: 'snake_case plural table name' },
      entity: { type: 'string', description: 'singular kebab-case entity for src/model/{entity}/' },
      archetype: { type: 'string', enum: vocabulary.archetype_keys },
      lifecycle: { type: 'string', enum: vocabulary.lifecycle_keys },
      purpose: { type: 'string' },
      why_needed: { type: 'string', description: 'Why the core workflow cannot work without this table' },
      columns: { type: 'array', items: column },
    },
  };

  return {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'tables', 'excluded', 'open_questions'],
    properties: {
      summary: { type: 'string' },
      tables: { type: 'array', items: table },
      excluded: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'reason'],
          properties: { name: { type: 'string' }, reason: { type: 'string' } },
        },
      },
      open_questions: stringArray,
    },
  };
};
