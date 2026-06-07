-- ============================================================================
-- Cleanup Orphaned ARD Generation Queue Items
-- Removes queue items that reference non-existent ARD tasks
-- ============================================================================

-- Delete queue items where task_id doesn't exist in ard_tasks
DELETE FROM ard_generation_queue
WHERE task_id NOT IN (SELECT id FROM ard_tasks);

-- Verify cleanup
SELECT 
  'Remaining Queue Items:' as status,
  COUNT(*) as count 
FROM ard_generation_queue;

SELECT 
  'ARD Tasks Available:' as status,
  COUNT(*) as count 
FROM ard_tasks;

-- Show any remaining failed items
SELECT 
  id,
  repo_id,
  status,
  error_message,
  task_id
FROM ard_generation_queue
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 10;
