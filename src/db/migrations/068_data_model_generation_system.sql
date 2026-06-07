-- ============================================
-- Data Model Generation System
-- ============================================

-- Drop old half-baked tables
DROP TABLE IF EXISTS data_entity_selected_tasks CASCADE;
DROP TABLE IF EXISTS data_entity_generation_tasks CASCADE;

-- Create new data model generation queue table
CREATE TABLE IF NOT EXISTS data_model_generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES project_repos(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES data_entity(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_content TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  cursor_exchange_id UUID REFERENCES cursor_generation_exchanges(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dm_queue_repo_id 
  ON data_model_generation_queue(repo_id);

CREATE INDEX IF NOT EXISTS idx_dm_queue_entity_id 
  ON data_model_generation_queue(entity_id);

CREATE INDEX IF NOT EXISTS idx_dm_queue_status 
  ON data_model_generation_queue(status);

CREATE INDEX IF NOT EXISTS idx_dm_queue_project_id 
  ON data_model_generation_queue(project_id);

-- Create index for cursor exchange lookups
CREATE INDEX IF NOT EXISTS idx_dm_queue_cursor_exchange_id 
  ON data_model_generation_queue(cursor_exchange_id) 
  WHERE cursor_exchange_id IS NOT NULL;

COMMENT ON TABLE data_model_generation_queue IS 'Queue for generating TypeScript model files from entity definitions';
COMMENT ON COLUMN data_model_generation_queue.file_path IS 'Path where the generated file will be placed, e.g., src/model/user.ts';
COMMENT ON COLUMN data_model_generation_queue.file_content IS 'Generated TypeScript code content';
COMMENT ON COLUMN data_model_generation_queue.status IS 'Current status: queued, processing, completed, or failed';
