-- ============================================================================
-- Data entities and fields for backend onboarding
-- One row per entity (e.g. lots, spaces); one row per field per entity
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_entity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  table_name VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_entity_project_id ON data_entity(project_id);
CREATE TRIGGER update_data_entity_updated_at BEFORE UPDATE ON data_entity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE data_entity IS 'Backend schema entities (tables) per project';
COMMENT ON COLUMN data_entity.table_name IS 'SQL table name; defaults to snake_case of name if null';

CREATE TABLE IF NOT EXISTS data_entity_field (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES data_entity(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  nullable BOOLEAN NOT NULL DEFAULT true,
  default_value TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_entity_field_entity_id ON data_entity_field(entity_id);
CREATE TRIGGER update_data_entity_field_updated_at BEFORE UPDATE ON data_entity_field
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE data_entity_field IS 'One row per field (column) per entity';
COMMENT ON COLUMN data_entity_field.type IS 'SQL type: text, uuid, integer, bigint, boolean, timestamp, timestamptz, jsonb, etc.';
