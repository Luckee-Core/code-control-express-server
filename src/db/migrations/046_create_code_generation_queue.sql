-- ============================================================================
-- Code Generation Queue Migration
-- Creates the code_generation_queue table for queuing AI code generation tasks
-- Queue items are processed by a cron job (every 10 min) via Supabase edge function
-- Supports multiple task types via data_entity_generation_tasks (model, migration, etc.)
-- ============================================================================

CREATE TYPE code_generation_queue_status AS ENUM (
  'queued',
  'processing',
  'completed',
  'failed'
);

CREATE TABLE IF NOT EXISTS code_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES project_repos(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES data_entity(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES data_entity_generation_tasks(id) ON DELETE CASCADE,
  selected_task_id UUID NOT NULL REFERENCES data_entity_selected_tasks(id) ON DELETE CASCADE,
  status code_generation_queue_status NOT NULL DEFAULT 'queued',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  cursor_exchange_id UUID REFERENCES cursor_generation_exchanges(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_code_gen_queue_status
  ON code_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_code_gen_queue_scheduled_at
  ON code_generation_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_code_gen_queue_project
  ON code_generation_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_code_gen_queue_entity
  ON code_generation_queue(entity_id);
CREATE INDEX IF NOT EXISTS idx_code_gen_queue_task
  ON code_generation_queue(task_id);

-- Composite index for querying due items (most important for cron processing)
CREATE INDEX IF NOT EXISTS idx_code_gen_queue_due
  ON code_generation_queue(status, scheduled_at)
  WHERE status = 'queued';

-- Updated_at trigger
CREATE TRIGGER update_code_generation_queue_updated_at
  BEFORE UPDATE ON code_generation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
