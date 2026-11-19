/** Lifecycle of a ticket build (plan → review → one PR per repo). */
export type TicketBuildStatus =
  | 'planning'
  | 'plan_ready'
  | 'plan_failed'
  | 'building'
  | 'opened'
  | 'partial'
  | 'failed'
  | 'merged';

/** Row in ticket_builds: one My Ops Tracker ticket being built across a software system's repos. */
export type TicketBuild = {
  id: string;
  software_system_id: string;
  /** My Ops Tracker tickets.id (another database). */
  ops_ticket_id: string;
  ops_ticket_title: string;
  ops_ticket_description: string | null;
  status: TicketBuildStatus;
  summary: string;
  /** Shared cross-repo contract (markdown): tables, operations, endpoints, types, slices. */
  contract_text: string;
  missing_roles_note: string;
  feedback: string;
  research_used: boolean;
  model: string;
  input_tokens: number;
  output_tokens: number;
  error: string | null;
  approved_at: string | null;
  ops_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTicketBuildInput = {
  software_system_id: string;
  ops_ticket_id: string;
  ops_ticket_title: string;
  ops_ticket_description: string | null;
  model: string;
};

export type UpdateTicketBuildInput = {
  status?: TicketBuildStatus;
  summary?: string;
  contract_text?: string;
  missing_roles_note?: string;
  feedback?: string;
  research_used?: boolean;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  error?: string | null;
  approved_at?: string | null;
  ops_synced_at?: string | null;
};
