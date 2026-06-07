-- ============================================================================
-- Fix cursor_generation_requests FK constraint for ARD tasks
-- ============================================================================

-- Drop the foreign key constraint on task_id
ALTER TABLE cursor_generation_requests
  DROP CONSTRAINT IF EXISTS cursor_generation_requests_task_id_fkey;

-- Make task_id nullable and remove NOT NULL constraint
ALTER TABLE cursor_generation_requests
  ALTER COLUMN task_id DROP NOT NULL;

-- Make entity_id and selected_task_id nullable too (not used for ARDs)
ALTER TABLE cursor_generation_requests
  ALTER COLUMN entity_id DROP NOT NULL;

ALTER TABLE cursor_generation_requests
  ALTER COLUMN selected_task_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN cursor_generation_requests.task_id IS 'References data_entity_generation_tasks for entity generation. NULL for ARD generation (uses ard_generation_queue.task_id instead).';
