-- ============================================================================
-- Convention Task Categories - Maps conventions to task categories
-- Many-to-many relationship with relevance scoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS convention_task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convention_id UUID NOT NULL REFERENCES build_conventions(id) ON DELETE CASCADE,
  task_category_id UUID NOT NULL REFERENCES task_categories(id) ON DELETE CASCADE,
  relevance_score INTEGER DEFAULT 3 CHECK (relevance_score BETWEEN 1 AND 5),
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(convention_id, task_category_id)
);

CREATE INDEX IF NOT EXISTS idx_convention_task_categories_convention 
  ON convention_task_categories(convention_id);
CREATE INDEX IF NOT EXISTS idx_convention_task_categories_task 
  ON convention_task_categories(task_category_id);
CREATE INDEX IF NOT EXISTS idx_convention_task_categories_relevance
  ON convention_task_categories(task_category_id, relevance_score DESC);

COMMENT ON TABLE convention_task_categories IS 
  'Maps build conventions to task categories with relevance scoring';
COMMENT ON COLUMN convention_task_categories.relevance_score IS 
  '1=optional, 3=recommended, 5=critical for this task type';
COMMENT ON COLUMN convention_task_categories.is_required IS 
  'Whether this convention must be included in prompts for this task';

-- ============================================================================
-- Auto-populate Conventions Based on Tags
-- Smart migration that assigns conventions to task categories
-- ============================================================================

-- CRUD API category (express)
INSERT INTO convention_task_categories (convention_id, task_category_id, relevance_score, is_required)
SELECT 
  c.id,
  tc.id,
  CASE 
    WHEN c.tags @> ARRAY['crud', 'data']::text[] THEN 5
    WHEN c.tags @> ARRAY['express', 'handler']::text[] THEN 4
    WHEN c.tags @> ARRAY['api']::text[] THEN 3
    ELSE 2
  END as relevance_score,
  c.tags @> ARRAY['crud']::text[] OR c.tags @> ARRAY['data']::text[] as is_required
FROM build_conventions c
CROSS JOIN task_categories tc
WHERE tc.name = 'CRUD API' 
  AND tc.app_type = 'express'
  AND c.app_type = 'express'
  AND (
    c.tags && ARRAY['express', 'data', 'crud', 'handler', 'api', 'typescript']::text[]
  );

-- Data Model category (express)
INSERT INTO convention_task_categories (convention_id, task_category_id, relevance_score, is_required)
SELECT 
  c.id,
  tc.id,
  CASE 
    WHEN c.tags @> ARRAY['data', 'database']::text[] THEN 5
    WHEN c.tags @> ARRAY['express']::text[] THEN 3
    ELSE 2
  END as relevance_score,
  c.tags @> ARRAY['data']::text[] as is_required
FROM build_conventions c
CROSS JOIN task_categories tc
WHERE tc.name = 'Data Model' 
  AND tc.app_type = 'express'
  AND c.app_type = 'express'
  AND (
    c.tags && ARRAY['express', 'data', 'typescript', 'database']::text[]
  )
ON CONFLICT (convention_id, task_category_id) DO NOTHING;

-- ARD Documentation category (express)
INSERT INTO convention_task_categories (convention_id, task_category_id, relevance_score, is_required)
SELECT 
  c.id,
  tc.id,
  CASE 
    WHEN c.tags @> ARRAY['docs']::text[] THEN 5
    WHEN c.tags @> ARRAY['express']::text[] THEN 3
    ELSE 2
  END as relevance_score,
  c.tags @> ARRAY['docs']::text[] as is_required
FROM build_conventions c
CROSS JOIN task_categories tc
WHERE tc.name = 'ARD Documentation' 
  AND tc.app_type = 'express'
  AND c.app_type = 'express'
  AND (
    c.tags && ARRAY['express', 'docs', 'typescript']::text[]
  )
ON CONFLICT (convention_id, task_category_id) DO NOTHING;

-- Redux Slice category (nextjs)
INSERT INTO convention_task_categories (convention_id, task_category_id, relevance_score, is_required)
SELECT 
  c.id,
  tc.id,
  CASE 
    WHEN c.tags @> ARRAY['redux']::text[] THEN 5
    WHEN c.tags @> ARRAY['nextjs']::text[] THEN 3
    ELSE 2
  END as relevance_score,
  c.tags @> ARRAY['redux']::text[] as is_required
FROM build_conventions c
CROSS JOIN task_categories tc
WHERE tc.name = 'Redux Slice' 
  AND tc.app_type = 'nextjs'
  AND c.app_type = 'nextjs'
  AND (
    c.tags && ARRAY['redux', 'typescript', 'nextjs']::text[]
  )
ON CONFLICT (convention_id, task_category_id) DO NOTHING;

-- API Client category (nextjs)
INSERT INTO convention_task_categories (convention_id, task_category_id, relevance_score, is_required)
SELECT 
  c.id,
  tc.id,
  CASE 
    WHEN c.tags @> ARRAY['api']::text[] THEN 5
    WHEN c.tags @> ARRAY['nextjs']::text[] THEN 3
    ELSE 2
  END as relevance_score,
  c.tags @> ARRAY['api']::text[] as is_required
FROM build_conventions c
CROSS JOIN task_categories tc
WHERE tc.name = 'API Client' 
  AND tc.app_type = 'nextjs'
  AND c.app_type = 'nextjs'
  AND (
    c.tags && ARRAY['api', 'typescript', 'nextjs']::text[]
  )
ON CONFLICT (convention_id, task_category_id) DO NOTHING;

-- Next.js Page category (nextjs)
INSERT INTO convention_task_categories (convention_id, task_category_id, relevance_score, is_required)
SELECT 
  c.id,
  tc.id,
  CASE 
    WHEN c.tags @> ARRAY['nextjs']::text[] THEN 5
    WHEN c.tags @> ARRAY['global']::text[] THEN 3
    ELSE 2
  END as relevance_score,
  c.tags @> ARRAY['nextjs']::text[] as is_required
FROM build_conventions c
CROSS JOIN task_categories tc
WHERE tc.name = 'Next.js Page' 
  AND tc.app_type = 'nextjs'
  AND c.app_type = 'nextjs'
  AND (
    c.tags && ARRAY['nextjs', 'typescript', 'global']::text[]
  )
ON CONFLICT (convention_id, task_category_id) DO NOTHING;
