-- ============================================================================
-- Migration 082: Create step_task_categories junction table
-- Maps build_steps to task_categories (which categories each step uses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS step_task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_step_id UUID NOT NULL REFERENCES build_steps(id) ON DELETE CASCADE,
  task_category_id UUID NOT NULL REFERENCES task_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(build_step_id, task_category_id)
);

CREATE INDEX IF NOT EXISTS idx_step_task_categories_step 
  ON step_task_categories(build_step_id);
CREATE INDEX IF NOT EXISTS idx_step_task_categories_task 
  ON step_task_categories(task_category_id);

COMMENT ON TABLE step_task_categories IS 
  'Maps build steps to the task categories they use (many-to-many)';
COMMENT ON COLUMN step_task_categories.build_step_id IS 
  'References build_steps table';
COMMENT ON COLUMN step_task_categories.task_category_id IS 
  'References task_categories table';

-- ============================================================================
-- Seed initial mappings for existing build steps
-- ============================================================================

-- CRUD API step (express) → api, express, data, handler, router
INSERT INTO step_task_categories (build_step_id, task_category_id)
SELECT 
  bs.id,
  tc.id
FROM build_steps bs
CROSS JOIN task_categories tc
WHERE bs.name = 'CRUD API' 
  AND bs.repo_type = 'express'
  AND tc.name IN ('api', 'express', 'data', 'handler', 'router')
ON CONFLICT (build_step_id, task_category_id) DO NOTHING;

-- Data Model step (express) → data, typescript
INSERT INTO step_task_categories (build_step_id, task_category_id)
SELECT 
  bs.id,
  tc.id
FROM build_steps bs
CROSS JOIN task_categories tc
WHERE bs.name = 'Data Model' 
  AND bs.repo_type = 'express'
  AND tc.name IN ('data', 'typescript')
ON CONFLICT (build_step_id, task_category_id) DO NOTHING;

-- ARD Documentation step (express) → docs
INSERT INTO step_task_categories (build_step_id, task_category_id)
SELECT 
  bs.id,
  tc.id
FROM build_steps bs
CROSS JOIN task_categories tc
WHERE bs.name = 'ARD Documentation' 
  AND bs.repo_type = 'express'
  AND tc.name IN ('docs')
ON CONFLICT (build_step_id, task_category_id) DO NOTHING;

-- Redux Slice step (nextjs) → redux, nextjs, typescript
INSERT INTO step_task_categories (build_step_id, task_category_id)
SELECT 
  bs.id,
  tc.id
FROM build_steps bs
CROSS JOIN task_categories tc
WHERE bs.name = 'Redux Slice' 
  AND bs.repo_type = 'nextjs'
  AND tc.name IN ('redux', 'nextjs', 'typescript')
ON CONFLICT (build_step_id, task_category_id) DO NOTHING;

-- API Client step (nextjs) → api, nextjs, typescript
INSERT INTO step_task_categories (build_step_id, task_category_id)
SELECT 
  bs.id,
  tc.id
FROM build_steps bs
CROSS JOIN task_categories tc
WHERE bs.name = 'API Client' 
  AND bs.repo_type = 'nextjs'
  AND tc.name IN ('api', 'nextjs', 'typescript')
ON CONFLICT (build_step_id, task_category_id) DO NOTHING;

-- Next.js Page step (nextjs) → nextjs, redux
INSERT INTO step_task_categories (build_step_id, task_category_id)
SELECT 
  bs.id,
  tc.id
FROM build_steps bs
CROSS JOIN task_categories tc
WHERE bs.name = 'Next.js Page' 
  AND bs.repo_type = 'nextjs'
  AND tc.name IN ('nextjs', 'redux')
ON CONFLICT (build_step_id, task_category_id) DO NOTHING;
