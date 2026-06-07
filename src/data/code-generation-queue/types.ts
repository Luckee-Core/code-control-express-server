/**
 * Code Generation Queue Types
 */

export type CodeGenerationQueueStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export type CodeGenerationQueue = {
  id: string;
  project_id: string;
  repo_id: string;
  entity_id: string;
  task_id: string;
  selected_task_id: string;
  status: CodeGenerationQueueStatus;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  cursor_exchange_id: string | null;
  pr_url: string | null;
  created_at: string;
  updated_at: string;
};
