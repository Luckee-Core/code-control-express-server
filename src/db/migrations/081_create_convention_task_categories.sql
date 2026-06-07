-- ============================================================================
-- Migration 081: Create convention_task_categories junction table
-- Maps build_conventions to task_categories (replaces tags system)
-- ============================================================================

CREATE TABLE IF NOT EXISTS convention_task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID NOT NULL REFERENCES build_conventions(id) ON DELETE CASCADE,
  task_category_id UUID NOT NULL REFERENCES task_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(convention_id, task_category_id)
);

CREATE INDEX IF NOT EXISTS idx_convention_task_categories_convention 
  ON convention_task_categories(convention_id);
CREATE INDEX IF NOT EXISTS idx_convention_task_categories_task 
  ON convention_task_categories(task_category_id);

COMMENT ON TABLE convention_task_categories IS 
  'Maps build conventions to task categories (many-to-many)';
COMMENT ON COLUMN convention_task_categories.convention_id IS 
  'References build_conventions table';
COMMENT ON COLUMN convention_task_categories.task_category_id IS 
  'References task_categories table';

-- ============================================================================
-- Auto-populate mappings from existing convention tags
-- ============================================================================

-- For each convention with tags, create junction rows for each tag
INSERT INTO convention_task_categories (convention_id, task_category_id)
SELECT DISTINCT
  c.id as convention_id,
  tc.id as task_category_id
FROM build_conventions c
CROSS JOIN LATERAL unnest(c.tags) as tag
INNER JOIN task_categories tc ON tc.name = tag
WHERE c.tags IS NOT NULL AND array_length(c.tags, 1) > 0
ON CONFLICT (convention_id, task_category_id) DO NOTHING;
