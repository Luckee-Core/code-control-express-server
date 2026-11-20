export type AgentKind = 'pr' | 'convention' | 'template';

export type AgentRunStatus =
  | 'draft'
  | 'running'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'superseded'
  | 'dismissed'
  | 'no_change'
  | 'failed';

/** One deterministic check result on an agent's output. */
export type AgentRunFinding = {
  severity: 'error' | 'warning';
  path: string;
  message: string;
  convention_key: string;
  /** Template runs: the template repo the finding is about. */
  repo?: string;
};

/** Row in agent_runs. */
export type AgentRun = {
  id: string;
  agent: AgentKind;
  status: AgentRunStatus;
  version: number;
  revision_of_run_id: string | null;
  parent_run_id: string | null;
  root_run_id: string | null;
  software_system_id: string | null;
  delivery_id: string | null;
  role_key: string | null;
  /** Template runs: the PRs opened in template repos (one per repo), shared with revisions. */
  template_change_ids: string[];
  title: string;
  summary: string;
  /** PR: { feedback, focus_paths }; convention: { pr_run_id }; template: { change_ids } (agent-specific). */
  input: Record<string, unknown>;
  instructions: string;
  /** Agent-specific result: commit_sha, no_change_reason, per-file notes, … */
  output: Record<string, unknown>;
  findings: AgentRunFinding[];
  decision_note: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  error: string | null;
  confirmed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAgentRunInput = {
  agent: AgentKind;
  status?: AgentRunStatus;
  version?: number;
  revision_of_run_id?: string | null;
  parent_run_id?: string | null;
  root_run_id?: string | null;
  software_system_id?: string | null;
  delivery_id?: string | null;
  role_key?: string | null;
  template_change_ids?: string[];
  title?: string;
  input?: Record<string, unknown>;
  instructions?: string;
};

export type UpdateAgentRunInput = {
  status?: AgentRunStatus;
  root_run_id?: string | null;
  template_change_ids?: string[];
  title?: string;
  summary?: string;
  input?: Record<string, unknown>;
  instructions?: string;
  output?: Record<string, unknown>;
  findings?: AgentRunFinding[];
  decision_note?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  duration_ms?: number;
  error?: string | null;
  confirmed_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  decided_at?: string | null;
};

/** Optional filters for listAgentRuns. */
export type ListAgentRunsFilter = {
  agent?: AgentKind;
  status?: AgentRunStatus;
  /** Any of these statuses (overrides status). */
  statuses?: AgentRunStatus[];
  software_system_id?: string;
  delivery_id?: string;
  root_run_id?: string;
  parent_run_id?: string;
  revision_of_run_id?: string;
  /** Default 200, max 1000. */
  limit?: number;
};

/** Row in pr_agent_edits. */
export type PrAgentEdit = {
  id: string;
  run_id: string;
  path: string;
  /** Null when the file is new. */
  before_content: string | null;
  after_content: string;
  explanation: string;
  sort_order: number;
  created_at: string;
};

export type PrAgentEditInput = {
  path: string;
  before_content: string | null;
  after_content: string;
  explanation?: string;
};

export type TemplateChangeStatus = 'open' | 'merged' | 'closed' | 'failed';

export type TemplateChangeFile = {
  path: string;
  action: 'create' | 'update';
  /** codegen | scaffold | adr */
  area: string;
};

/** Row in template_changes (one PR in a template repo). */
export type TemplateChange = {
  id: string;
  role_key: string;
  repo_full_name: string;
  branch: string;
  base_branch: string;
  base_sha: string;
  head_sha: string;
  pr_number: number | null;
  pr_url: string;
  title: string;
  status: TemplateChangeStatus;
  files: TemplateChangeFile[];
  merge_sha: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTemplateChangeInput = {
  role_key: string;
  repo_full_name: string;
  branch: string;
  base_branch?: string;
  base_sha?: string;
  title?: string;
};

export type UpdateTemplateChangeInput = {
  base_branch?: string;
  base_sha?: string;
  head_sha?: string;
  pr_number?: number | null;
  pr_url?: string;
  title?: string;
  status?: TemplateChangeStatus;
  files?: TemplateChangeFile[];
  merge_sha?: string | null;
};

export type ConventionChangePropagationStatus = 'pending' | 'in_run' | 'merged' | 'not_needed' | 'skipped' | 'denied';

/** Row in convention_change_propagations. */
export type ConventionChangePropagation = {
  id: string;
  convention_change_id: string;
  template_repo: string;
  role_key: string;
  status: ConventionChangePropagationStatus;
  run_id: string | null;
  reason: string;
  created_at: string;
  updated_at: string;
};

export type InsertConventionChangePropagationInput = {
  convention_change_id: string;
  template_repo: string;
  role_key: string;
  status?: ConventionChangePropagationStatus;
  run_id?: string | null;
  reason?: string;
};

export type ListConventionChangePropagationsFilter = {
  convention_change_ids?: string[];
  run_id?: string;
  template_repo?: string;
  status?: ConventionChangePropagationStatus;
};

/** Bulk update for propagations selected by ids or by run. */
export type UpdateConventionChangePropagationsInput = {
  ids?: string[];
  run_id?: string;
  /** With run_id: only this template repo's rows. */
  template_repo?: string;
  /** Only rows currently in one of these statuses. */
  from_statuses?: ConventionChangePropagationStatus[];
  status?: ConventionChangePropagationStatus;
  /** Set run_id (null detaches). */
  set_run_id?: string | null;
  reason?: string;
};

export type AiExchangeStatus = 'ok' | 'error';

/** Row in ai_exchanges. */
export type AiExchange = {
  id: string;
  run_id: string;
  purpose: string;
  model: string;
  served_by_model: string;
  system_prompt: string;
  user_message: string;
  output_schema: Record<string, unknown> | null;
  status: AiExchangeStatus;
  raw_text: string;
  parsed: unknown;
  stop_reason: string | null;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  error: string | null;
  created_at: string;
};

/** List view: everything except the prompt and response bodies. */
export type AiExchangeSummary = Omit<AiExchange, 'system_prompt' | 'user_message' | 'output_schema' | 'raw_text' | 'parsed'>;

export type RecordAiExchangeInput = Omit<AiExchange, 'id' | 'created_at'>;
