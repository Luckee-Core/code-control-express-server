-- ============================================================================
-- Profile Assignments - Link repositories to profile templates
-- Separate assignment table for each task type
-- ============================================================================

-- Data Model Profile Assignments
CREATE TABLE IF NOT EXISTS data_model_profile_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES project_repos(id) ON DELETE CASCADE,
  data_model_profile_id UUID NOT NULL REFERENCES data_model_code_task_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(repo_id)
);

CREATE INDEX IF NOT EXISTS idx_data_model_assignments_repo 
  ON data_model_profile_assignments(repo_id);
CREATE INDEX IF NOT EXISTS idx_data_model_assignments_profile 
  ON data_model_profile_assignments(data_model_profile_id);

CREATE TRIGGER update_data_model_assignments_updated_at BEFORE UPDATE ON data_model_profile_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE data_model_profile_assignments IS 
  'Maps repositories to data model profile templates';

-- CRUD API Profile Assignments
CREATE TABLE IF NOT EXISTS crud_api_profile_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES project_repos(id) ON DELETE CASCADE,
  crud_api_profile_id UUID NOT NULL REFERENCES crud_api_code_task_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(repo_id)
);

CREATE INDEX IF NOT EXISTS idx_crud_api_assignments_repo 
  ON crud_api_profile_assignments(repo_id);
CREATE INDEX IF NOT EXISTS idx_crud_api_assignments_profile 
  ON crud_api_profile_assignments(crud_api_profile_id);

CREATE TRIGGER update_crud_api_assignments_updated_at BEFORE UPDATE ON crud_api_profile_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE crud_api_profile_assignments IS 
  'Maps repositories to CRUD API profile templates';

-- ARD Profile Assignments
CREATE TABLE IF NOT EXISTS ard_profile_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES project_repos(id) ON DELETE CASCADE,
  ard_profile_id UUID NOT NULL REFERENCES ard_code_task_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(repo_id)
);

CREATE INDEX IF NOT EXISTS idx_ard_assignments_repo 
  ON ard_profile_assignments(repo_id);
CREATE INDEX IF NOT EXISTS idx_ard_assignments_profile 
  ON ard_profile_assignments(ard_profile_id);

CREATE TRIGGER update_ard_assignments_updated_at BEFORE UPDATE ON ard_profile_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ard_profile_assignments IS 
  'Maps repositories to ARD documentation profile templates';
