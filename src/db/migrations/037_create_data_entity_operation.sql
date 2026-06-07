-- ============================================================================
-- Data entity operations: selected CRUD ops per entity (getAll, getById, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_entity_operation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_entity_id UUID NOT NULL REFERENCES data_entity(id) ON DELETE CASCADE,
  operation_key VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(data_entity_id, operation_key)
);

CREATE INDEX IF NOT EXISTS idx_data_entity_operation_entity_id ON data_entity_operation(data_entity_id);
CREATE TRIGGER update_data_entity_operation_updated_at
  BEFORE UPDATE ON data_entity_operation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE data_entity_operation IS 'Selected CRUD operations per entity (getAll, getById, create, update, delete, getXGivenY)';
