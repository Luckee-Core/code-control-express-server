-- ============================================================================
-- Refactor CRUD API Generation Queue for File-Based PRs
-- Changes from entity-level (multiple operations per item) to file-level (one operation per item)
-- ============================================================================

-- 1. Add new columns for file-based generation
ALTER TABLE crud_api_generation_queue
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES crud_api_tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS operation_key TEXT;

-- 2. Create indexes on new columns
CREATE INDEX IF NOT EXISTS idx_crud_api_queue_task_id ON crud_api_generation_queue(task_id);
CREATE INDEX IF NOT EXISTS idx_crud_api_queue_operation_key ON crud_api_generation_queue(operation_key);

-- 3. Update comments
COMMENT ON COLUMN crud_api_generation_queue.task_id IS 'References CRUD task template in crud_api_tasks';
COMMENT ON COLUMN crud_api_generation_queue.file_path IS 'Generated file path, e.g., src/data/users/get-all.ts';
COMMENT ON COLUMN crud_api_generation_queue.operation_key IS 'Operation key: get-all, get-by-id, create, update, delete, router, index';

-- 4. Drop old column (selected_operation_keys no longer needed - one operation per queue item)
-- Note: This will delete existing queue items. Run this only after migrating to new system.
-- ALTER TABLE crud_api_generation_queue DROP COLUMN IF EXISTS selected_operation_keys;

COMMENT ON TABLE crud_api_generation_queue IS 'Queue for tracking individual CRUD file generation (one file per queue item)';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'crud_api_generation_queue'
  AND column_name IN ('task_id', 'file_path', 'operation_key', 'selected_operation_keys')
ORDER BY column_name;
