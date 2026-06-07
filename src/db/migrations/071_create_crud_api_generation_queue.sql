-- Migration: Create crud_api_generation_queue table
-- Date: 2026-03-01
-- Description: Queue table for tracking CRUD API operations generation

CREATE TABLE IF NOT EXISTS crud_api_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  repo_id UUID NOT NULL,
  entity_id UUID NOT NULL,
  selected_operation_keys TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  pr_link TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_project
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_repo
    FOREIGN KEY (repo_id)
    REFERENCES project_repos(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_entity
    FOREIGN KEY (entity_id)
    REFERENCES data_entity(id)
    ON DELETE CASCADE,
    
  CONSTRAINT valid_status
    CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
);

-- Index for faster queries
CREATE INDEX idx_crud_api_queue_project ON crud_api_generation_queue(project_id);
CREATE INDEX idx_crud_api_queue_repo ON crud_api_generation_queue(repo_id);
CREATE INDEX idx_crud_api_queue_entity ON crud_api_generation_queue(entity_id);
CREATE INDEX idx_crud_api_queue_status ON crud_api_generation_queue(status);

-- Trigger to update updated_at
CREATE TRIGGER update_crud_api_generation_queue_updated_at
BEFORE UPDATE ON crud_api_generation_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE crud_api_generation_queue IS 'Queue for tracking CRUD API operations generation';
COMMENT ON COLUMN crud_api_generation_queue.selected_operation_keys IS 'Array of operation keys to generate (e.g., getAll, getById, create, update, delete, getByUserId)';
