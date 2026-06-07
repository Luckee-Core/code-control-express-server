-- ============================================================================
-- Add foreign key reference to data_entity_field
-- When set, the field is a FK pointing to that entity (e.g. seller_id -> sellers)
-- Used to derive dynamic CRUD options like getSpacesGivenSeller
-- ============================================================================

ALTER TABLE data_entity_field
ADD COLUMN IF NOT EXISTS references_entity_id UUID REFERENCES data_entity(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_data_entity_field_references_entity_id
ON data_entity_field(references_entity_id)
WHERE references_entity_id IS NOT NULL;

COMMENT ON COLUMN data_entity_field.references_entity_id IS 'FK to data_entity: when set, this field references that entity (e.g. seller_id -> sellers)';
