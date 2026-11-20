import type { AgentKind, AgentRunStatus } from '../../model/agent-run';

/** Convention domains that apply to each repo role (the role filter narrows each domain's rules). */
export const ROLE_CONVENTION_DOMAINS: Record<string, string[]> = {
  storage: ['data_model'],
  express: ['api_services', 'data_model'],
  web: ['web_data', 'data_model'],
  mobile: ['mobile_app', 'data_model'],
};

export const AGENT_LABELS: Record<AgentKind, string> = {
  pr: 'PR agent',
  convention: 'Convention agent',
  template: 'Template agent',
};

/** Statuses waiting on a person (sidebar badges). */
export const WAITING_STATUSES: AgentRunStatus[] = ['draft', 'needs_review'];

/** Statuses that end a run. */
export const FINAL_STATUSES: AgentRunStatus[] = ['approved', 'rejected', 'superseded', 'dismissed', 'no_change'];

/** Upper bound on file text sent to an agent in one prompt (characters). */
export const MAX_PROMPT_FILE_CHARS = 400_000;

/** Max files the template agent may ask to read in its first pass. */
export const MAX_TEMPLATE_FILES_TO_READ = 25;

/** Branch for a template agent's PR. */
export const templateBranchName = (runId: string): string => `code-control/conventions-${runId.slice(0, 8)}`;

/** First line of free text, shortened for titles. */
export const titleFrom = (text: string, max = 80): string => {
  const line = text.trim().split('\n')[0] ?? '';
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
};
