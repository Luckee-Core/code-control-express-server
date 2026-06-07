-- ============================================================================
-- Add app_type to projects for app-type-driven workspace
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE app_type AS ENUM ('marketplace', 'field_service', 'social', 'saas', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS app_type app_type DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS app_type_config JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_projects_app_type ON projects(app_type);

COMMENT ON COLUMN projects.app_type IS 'Template/app type for project (marketplace, field_service, etc.)';
COMMENT ON COLUMN projects.app_type_config IS 'App-type-specific configuration overrides';
