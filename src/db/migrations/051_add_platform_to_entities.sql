-- ============================================================================
-- Add platform assignments and description to data_entity
-- ============================================================================

ALTER TABLE data_entity
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS assigned_platforms TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_data_entity_assigned_platforms ON data_entity USING GIN(assigned_platforms);

COMMENT ON COLUMN data_entity.assigned_platforms IS 'Platform IDs this entity belongs to (seller_web, seller_mobile, buyer_mobile)';
