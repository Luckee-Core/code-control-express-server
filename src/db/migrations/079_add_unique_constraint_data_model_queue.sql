-- ============================================
-- Add Unique Constraint to Data Model Generation Queue
-- ============================================
-- Prevents duplicate queue items for the same entity + repo combo
-- This allows retries (failed status) but prevents multiple active/completed items

-- First, clean up any existing duplicates (keep the most recent one per entity+repo combo)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, repo_id, entity_id 
      ORDER BY created_at DESC
    ) as rn
  FROM data_model_generation_queue
)
DELETE FROM data_model_generation_queue
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint
-- This prevents creating multiple queue items for the same entity in the same repo
ALTER TABLE data_model_generation_queue
ADD CONSTRAINT unique_entity_repo_active_queue 
UNIQUE (project_id, repo_id, entity_id);

COMMENT ON CONSTRAINT unique_entity_repo_active_queue ON data_model_generation_queue 
IS 'Ensures only one queue item exists per entity per repo (prevents duplicates)';
