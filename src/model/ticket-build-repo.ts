export type TicketBuildRepoStatus = 'pending' | 'skipped' | 'running' | 'opened' | 'merged' | 'closed' | 'failed';

/** Row in ticket_build_repos: one repo's plan and PR within a ticket build. */
export type TicketBuildRepo = {
  id: string;
  ticket_build_id: string;
  software_system_repo_id: string;
  /** repo_roles.key, or the role implied by repo_type when the repo has none. */
  role: string;
  /** owner/repo */
  repo_full_name: string;
  repo_url: string;
  position: number;
  included: boolean;
  plan_text: string;
  status: TicketBuildRepoStatus;
  cursor_agent_id: string | null;
  cursor_run_id: string | null;
  pr_number: number | null;
  pr_url: string;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTicketBuildRepoInput = {
  ticket_build_id: string;
  software_system_repo_id: string;
  role: string;
  repo_full_name: string;
  repo_url: string;
  position: number;
};

export type UpdateTicketBuildRepoInput = {
  included?: boolean;
  plan_text?: string;
  status?: TicketBuildRepoStatus;
  cursor_agent_id?: string | null;
  cursor_run_id?: string | null;
  pr_number?: number | null;
  pr_url?: string;
  error?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
};
