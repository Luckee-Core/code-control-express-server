/** Where an AI call came from in a software system. */
export type AiCostSource = 'data_model' | 'ticket_build' | 'pr_agent' | 'convention_agent' | 'template_agent';

/**
 * One AI call made for a software system, from any of its AI ledgers (data-model proposals,
 * ticket builds, agent runs), without prompt or response bodies. Cost is computed by the web.
 */
export type AiCostCall = {
  /** Exchange id in its own ledger. */
  id: string;
  source: AiCostSource;
  /** Proposal, ticket build or agent run id. */
  source_id: string;
  /** "Data model v3", ticket title or agent run title. */
  source_label: string;
  /** Agent runs only: the delivery (PR) the run worked on, and its kind — model (Data model tab) or crud (API tab). */
  delivery_id: string | null;
  delivery_kind: 'model' | 'crud' | 'layout' | 'list' | 'detail' | 'dashboard' | 'dispatcher' | null;
  purpose: string;
  model: string;
  served_by_model: string;
  status: 'ok' | 'error';
  stop_reason: string | null;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  error: string | null;
  created_at: string;
};
