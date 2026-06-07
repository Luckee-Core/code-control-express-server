-- ============================================================================
-- Dynamic Guided Pathway: Repos as platforms
-- - Add current_phase and phase_status to project_repos
-- - Replace assigned_platforms with assigned_repo_ids on data_entity
-- - Drop project_platforms table
-- ============================================================================

-- 1. Add phase tracking to project_repos
ALTER TABLE project_repos
ADD COLUMN IF NOT EXISTS current_phase VARCHAR(100),
ADD COLUMN IF NOT EXISTS phase_status VARCHAR(50) DEFAULT 'pending';

COMMENT ON COLUMN project_repos.current_phase IS 'Current build phase (data_model, crud_api, screens, etc.)';
COMMENT ON COLUMN project_repos.phase_status IS 'Phase status: pending, in_progress, completed';

-- 2. Add assigned_repo_ids to data_entity (replaces assigned_platforms)
ALTER TABLE data_entity
ADD COLUMN IF NOT EXISTS assigned_repo_ids UUID[] DEFAULT ARRAY[]::UUID[];

CREATE INDEX IF NOT EXISTS idx_data_entity_assigned_repo_ids ON data_entity USING GIN(assigned_repo_ids);

COMMENT ON COLUMN data_entity.assigned_repo_ids IS 'Repo IDs (project_repos) this entity is assigned to for code generation';

-- 3. Drop old assigned_platforms (if exists)
DROP INDEX IF EXISTS idx_data_entity_assigned_platforms;
ALTER TABLE data_entity DROP COLUMN IF EXISTS assigned_platforms;

-- 4. Drop project_platforms table
DROP TABLE IF EXISTS project_platforms;
