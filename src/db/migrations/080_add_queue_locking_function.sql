-- ============================================
-- Add Database Function for Queue Item Locking
-- ============================================
-- Creates PostgreSQL functions that fetch and lock queue items atomically
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions

-- Function 1: Get and lock due items (used by process-due-queue-items.ts)
CREATE OR REPLACE FUNCTION get_and_lock_due_queue_items(item_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  repo_id UUID,
  entity_id UUID,
  file_path TEXT,
  file_content TEXT,
  status TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  cursor_exchange_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Fetch and lock queue items atomically to prevent race conditions
  -- FOR UPDATE SKIP LOCKED ensures:
  -- 1. Items are locked when selected
  -- 2. Other processes skip already-locked items
  -- 3. No duplicate processing of same item
  RETURN QUERY
  UPDATE data_model_generation_queue q
  SET 
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW()
  FROM (
    SELECT dmq.id
    FROM data_model_generation_queue dmq
    WHERE dmq.status = 'queued'
      AND dmq.scheduled_at <= NOW()
    ORDER BY dmq.scheduled_at ASC
    LIMIT item_limit
    FOR UPDATE SKIP LOCKED
  ) as subquery
  WHERE q.id = subquery.id
  RETURNING q.*;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get and lock next item for specific project+repo (used by process-queue.ts)
CREATE OR REPLACE FUNCTION get_and_lock_queue_item_for_repo(
  p_project_id UUID,
  p_repo_id UUID
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  repo_id UUID,
  entity_id UUID,
  file_path TEXT,
  file_content TEXT,
  status TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  cursor_exchange_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Fetch and lock the next queue item for a specific project+repo
  RETURN QUERY
  UPDATE data_model_generation_queue q
  SET 
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW()
  FROM (
    SELECT dmq.id
    FROM data_model_generation_queue dmq
    WHERE dmq.project_id = p_project_id
      AND dmq.repo_id = p_repo_id
      AND dmq.status = 'queued'
      AND dmq.scheduled_at <= NOW()
    ORDER BY dmq.scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  ) as subquery
  WHERE q.id = subquery.id
  RETURNING q.*;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_and_lock_due_queue_items IS 
'Atomically fetches and marks queue items as processing using FOR UPDATE SKIP LOCKED to prevent race conditions';

COMMENT ON FUNCTION get_and_lock_queue_item_for_repo IS
'Atomically fetches and marks the next queue item for a specific project+repo as processing';
