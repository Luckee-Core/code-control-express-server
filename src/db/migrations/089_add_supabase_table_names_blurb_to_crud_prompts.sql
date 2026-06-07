-- ============================================================================
-- Add SUPABASE_TABLE_NAMES instruction to all entity-level CRUD task prompts
-- ============================================================================

UPDATE crud_api_tasks
SET prompt_template = prompt_template || E'\n\n## Table names (CRITICAL)\nUse the SUPABASE_TABLE_NAMES enum/file for table names; do not hardcode table name strings. Reference the appropriate value from that file (e.g. from ''@/config/supabase-table-names'' or ''../../config/supabase-table-names'') instead of typing the table name literally (e.g. .from(SUPABASE_TABLE_NAMES.ENTITY_NAME)).',
    updated_at = NOW()
WHERE operation_key IN ('get-all', 'get-by-id', 'create', 'update', 'delete', 'router', 'index')
  AND prompt_template NOT LIKE '%SUPABASE_TABLE_NAMES%';
