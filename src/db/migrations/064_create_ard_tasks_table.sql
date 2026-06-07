-- ============================================================================
-- Create ARD Tasks Table
-- Separates ARD tasks from data entity generation tasks
-- ============================================================================

-- 1. Create ard_tasks table
CREATE TABLE IF NOT EXISTS ard_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  task_type TEXT NOT NULL UNIQUE,
  description TEXT,
  prompt_template TEXT NOT NULL,
  output_path_template TEXT NOT NULL,
  stack_type TEXT NOT NULL CHECK (stack_type IN ('express', 'nextjs', 'react-native')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ard_tasks_stack_type ON ard_tasks(stack_type);
CREATE INDEX IF NOT EXISTS idx_ard_tasks_sort_order ON ard_tasks(stack_type, sort_order);

CREATE TRIGGER update_ard_tasks_updated_at BEFORE UPDATE ON ard_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ard_tasks IS 'ARD (Architecture Rules Documentation) generation tasks specific to stack types';
COMMENT ON COLUMN ard_tasks.stack_type IS 'Stack type this ARD task is for: express, nextjs, react-native';
COMMENT ON COLUMN ard_tasks.task_type IS 'Unique identifier for the task type (e.g., ard_express_router_factory)';

-- 2. Migrate existing ARD tasks from data_entity_generation_tasks to ard_tasks
-- Only migrate tasks with task_type starting with 'ard_'
INSERT INTO ard_tasks (
  name,
  task_type,
  description,
  prompt_template,
  output_path_template,
  stack_type,
  sort_order
)
SELECT 
  name,
  task_type,
  description,
  prompt_template,
  output_path_template,
  CASE 
    WHEN task_type IN ('ard_agents_md', 'ard_architecture_readme') THEN 'express' -- Shared but default to express
    ELSE 'express' -- All current tasks are express-focused
  END as stack_type,
  sort_order
FROM data_entity_generation_tasks
WHERE task_type LIKE 'ard_%';

-- 3. Update ard_generation_queue to reference ard_tasks instead of data_entity_generation_tasks
-- First, add new column
ALTER TABLE ard_generation_queue
  ADD COLUMN IF NOT EXISTS ard_task_id UUID REFERENCES ard_tasks(id) ON DELETE CASCADE;

-- Migrate existing task_id references to ard_task_id
UPDATE ard_generation_queue agq
SET ard_task_id = at.id
FROM data_entity_generation_tasks degt
JOIN ard_tasks at ON at.task_type = degt.task_type
WHERE agq.task_id = degt.id;

-- Delete any orphaned queue items that couldn't be migrated
DELETE FROM ard_generation_queue WHERE ard_task_id IS NULL;

-- Create index on new column
CREATE INDEX IF NOT EXISTS idx_ard_generation_queue_ard_task_id ON ard_generation_queue(ard_task_id);

-- 4. Delete ARD tasks from data_entity_generation_tasks (they're now in ard_tasks)
DELETE FROM data_entity_generation_tasks WHERE task_type LIKE 'ard_%';

-- 5. Drop the old task_id column from ard_generation_queue (after migration)
ALTER TABLE ard_generation_queue DROP COLUMN IF EXISTS task_id;

-- Rename ard_task_id to task_id for cleaner naming
ALTER TABLE ard_generation_queue RENAME COLUMN ard_task_id TO task_id;

-- Update comment
COMMENT ON COLUMN ard_generation_queue.task_id IS 'References ARD task in ard_tasks table';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify ARD tasks migrated
SELECT 'ARD Tasks Created:' as status, COUNT(*) as count FROM ard_tasks;

-- List all ARD tasks
SELECT 
  stack_type,
  name,
  output_path_template,
  sort_order
FROM ard_tasks
ORDER BY stack_type, sort_order;

-- Verify queue references are updated
SELECT 
  'Queue Items with ARD Task References:' as status,
  COUNT(*) as count 
FROM ard_generation_queue 
WHERE task_id IS NOT NULL;
