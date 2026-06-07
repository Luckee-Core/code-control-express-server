-- ============================================================================
-- Migration 087: Fix repo_type mismatch between tables
-- Changes 'web' to 'nextjs' and 'mobile' to 'react-native' for consistency
-- ============================================================================

-- ============================================================================
-- 1. Update project_repos table
-- ============================================================================

-- Update existing 'web' repos to 'nextjs'
UPDATE project_repos
SET repo_type = 'nextjs'
WHERE repo_type = 'web';

-- Update existing 'mobile' repos to 'react-native'
UPDATE project_repos
SET repo_type = 'react-native'
WHERE repo_type = 'mobile';

-- ============================================================================
-- 2. Update build_steps table
-- ============================================================================

-- Update existing 'web' build steps to 'nextjs'
UPDATE build_steps
SET repo_type = 'nextjs'
WHERE repo_type = 'web';

-- Update existing 'mobile' build steps to 'react-native'
UPDATE build_steps
SET repo_type = 'react-native'
WHERE repo_type = 'mobile';

-- ============================================================================
-- 3. No changes needed for ard_code_task_profiles table
-- This table already uses app_type with correct values: 'express', 'nextjs', 'react-native'
-- ============================================================================

-- ============================================================================
-- 4. Copy step_task_categories mappings for nextjs and react-native ARD steps
-- ============================================================================

-- Copy mappings from express ARD Documentation to nextjs ARD Documentation
INSERT INTO step_task_categories (build_step_id, task_category_id)
SELECT 
  (SELECT id FROM build_steps WHERE name = 'ARD Documentation' AND repo_type = 'nextjs'),
  stc.task_category_id
FROM step_task_categories stc
WHERE stc.build_step_id = (SELECT id FROM build_steps WHERE name = 'ARD Documentation' AND repo_type = 'express')
ON CONFLICT (build_step_id, task_category_id) DO NOTHING;

-- Copy mappings from express ARD Documentation to react-native ARD Documentation
INSERT INTO step_task_categories (build_step_id, task_category_id)
SELECT 
  (SELECT id FROM build_steps WHERE name = 'ARD Documentation' AND repo_type = 'react-native'),
  stc.task_category_id
FROM step_task_categories stc
WHERE stc.build_step_id = (SELECT id FROM build_steps WHERE name = 'ARD Documentation' AND repo_type = 'express')
ON CONFLICT (build_step_id, task_category_id) DO NOTHING;

-- ============================================================================
-- 4. repo_build_profiles table not in use - skipping
-- ============================================================================

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Show project_repos repo_type distribution
SELECT 
  'project_repos repo_types' as table_name,
  repo_type,
  COUNT(*) as count
FROM project_repos
GROUP BY repo_type
ORDER BY repo_type;

-- Show build_steps repo_type distribution
SELECT 
  'build_steps repo_types' as table_name,
  repo_type,
  COUNT(*) as count
FROM build_steps
GROUP BY repo_type
ORDER BY repo_type;

-- Show ard_tasks stack_type distribution
SELECT 
  'ard_tasks stack_types' as table_name,
  stack_type,
  COUNT(*) as count
FROM ard_tasks
GROUP BY stack_type
ORDER BY stack_type;

-- ============================================================================
-- Expected results after running this migration:
--
-- All tables should use consistent naming:
-- - 'express' (unchanged)
-- - 'nextjs' (was 'web')
-- - 'react-native' (was 'mobile')
--
-- This aligns with:
-- - ard_tasks.stack_type values
-- - build_profiles.stack_type values (if used)
-- ============================================================================
