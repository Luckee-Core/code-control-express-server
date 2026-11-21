export type DataModelProposalStatus = 'running' | 'ready' | 'failed' | 'approved' | 'superseded';

export type ProposedOnDelete = 'none' | 'cascade' | 'set_null' | 'restrict';

/** One column the AI proposes (standard columns id/created_at/updated_at are never listed). */
export type ProposedColumn = {
  name: string;
  /** column_types.key */
  type: string;
  nullable: boolean;
  /** SQL default expression, '' when none. */
  default_sql: string;
  /** Allowed values when type is enum; [] otherwise. */
  enum_values: string[];
  /** Target table for a foreign key, '' when none. */
  references_table: string;
  on_delete: ProposedOnDelete;
  is_unique: boolean;
  is_indexed: boolean;
  description: string;
};

/** One table the AI proposes. */
export type ProposedTable = {
  /** snake_case plural table name. */
  name: string;
  /** Singular kebab-case entity used for src/model/{entity}/. */
  entity: string;
  /** table_archetypes.key */
  archetype: string;
  /** lifecycle_options.key */
  lifecycle: string;
  purpose: string;
  why_needed: string;
  columns: ProposedColumn[];
};

export type ExcludedTable = {
  name: string;
  reason: string;
};

export type ProposalQuestionOption = {
  label: string;
  /** What choosing this option changes in the tables (shown next to the option). */
  schema_effect: string;
};

/**
 * A product decision the context leaves open. Structural choices (naming, types, keys, delete
 * behavior, lifecycles) are never questions: conventions decide them. The proposal already
 * implements `recommended_option`.
 */
export type ProposalQuestion = {
  question: string;
  why_it_matters: string;
  options: ProposalQuestionOption[];
  /** Label of the option the proposal implements. */
  recommended_option: string;
};

/** A structural choice no convention covered: the designer made it and suggests a convention. */
export type ConventionGap = {
  topic: string;
  decision: string;
  suggested_convention: string;
};

/** Normalized AI output stored in data_model_proposals.proposal. */
export type DataModelProposalContent = {
  summary: string;
  tables: ProposedTable[];
  excluded: ExcludedTable[];
  /** Older proposals stored plain strings; readers normalize them. */
  open_questions: ProposalQuestion[];
  /** Missing on proposals made before convention gaps existed. */
  convention_gaps?: ConventionGap[];
};

export type ProposalWarningSeverity = 'error' | 'warning';

/** Lint finding against the seeded conventions. */
export type ProposalWarning = {
  code: string;
  severity: ProposalWarningSeverity;
  table: string;
  column: string;
  message: string;
  convention_key: string;
};

/** Row in data_model_proposals. */
export type DataModelProposal = {
  id: string;
  software_system_id: string;
  version: number;
  parent_proposal_id: string | null;
  status: DataModelProposalStatus;
  context_text: string;
  feedback: string;
  proposal: DataModelProposalContent | null;
  warnings: ProposalWarning[];
  conventions_hash: string;
  /** Omitted from list queries (large). */
  conventions_snapshot?: Record<string, unknown> | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  error: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateDataModelProposalInput = {
  software_system_id: string;
  parent_proposal_id?: string | null;
  context_text: string;
  feedback?: string;
  conventions_hash?: string;
  conventions_snapshot?: Record<string, unknown> | null;
  model?: string;
};

export type UpdateDataModelProposalInput = {
  status?: DataModelProposalStatus;
  proposal?: DataModelProposalContent | null;
  warnings?: ProposalWarning[];
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  error?: string | null;
  approved_at?: string | null;
};
