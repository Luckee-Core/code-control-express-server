export type ARDGenerationQueue = {
  id: string;
  project_id: string;
  repo_id: string;
  task_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  cursor_exchange_id: string | null;
  created_at: string;
  updated_at: string;
};
