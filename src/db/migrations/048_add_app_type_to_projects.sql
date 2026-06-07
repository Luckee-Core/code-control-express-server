-- ============================================================================
-- Add app_type to customer_projects for app-type-driven project setup
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE app_type AS ENUM ('marketplace', 'field_service', 'social', 'saas', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE customer_projects
ADD COLUMN IF NOT EXISTS app_type app_type DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS app_type_config JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_customer_projects_app_type ON customer_projects(app_type);

COMMENT ON COLUMN customer_projects.app_type IS 'Template/app type for project (marketplace, field_service, etc.)';
COMMENT ON COLUMN customer_projects.app_type_config IS 'App-type-specific configuration overrides';
