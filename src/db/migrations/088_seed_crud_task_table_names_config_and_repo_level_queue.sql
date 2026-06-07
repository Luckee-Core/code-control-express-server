-- ============================================================================
-- Seed CRUD API task: Table names config (SUPABASE_TABLE_NAMES)
-- Allow repo-level queue items (entity_id nullable)
-- ============================================================================

-- 1. Seed one row into crud_api_tasks for creating/updating the table names config file
INSERT INTO crud_api_tasks (
  name,
  task_type,
  description,
  prompt_template,
  output_path_template,
  operation_key,
  sort_order
) VALUES (
  'Table names config',
  'crud_table_names_config',
  'Generate the SUPABASE_TABLE_NAMES enum from data entities for the repo; CRUD code must use this enum instead of hardcoding table names.',
  '# Task
Create or update the table names config file at {{output_path}} for the {{repo_name}} repository.

# Table names (from data entities)

The following table names are used by this project. You must export a TypeScript enum named exactly `SUPABASE_TABLE_NAMES` with these table names so CRUD code can reference them instead of hardcoding strings.

{{table_names_list}}

# Output file — enum name and usage (required)

- Path: {{output_path}}
- Export exactly one enum named `SUPABASE_TABLE_NAMES` (no other name, no const object). Each member must be a key whose value is the exact table name string.
- Example shape: enum key SCREAMING_SNAKE_CASE, value is the exact table name string.
  ```typescript
  export enum SUPABASE_TABLE_NAMES {
    MY_ENTITY = ''my_entity'',
    OTHER_TABLE = ''other_table'',
  }
  ```
- Usage in CRUD code: `.from(SUPABASE_TABLE_NAMES.MY_ENTITY)` — never hardcode the string; always use the enum member (same SCREAMING_SNAKE_CASE as the enum keys).

# Requirements

- One file at exactly: {{output_path}}
- The enum must be named `SUPABASE_TABLE_NAMES` and nothing else
- All table names from the list must be included as enum members with the exact table name as the value
- CRUD generators are instructed to import and use `SUPABASE_TABLE_NAMES` from this file',
  'src/config/supabase-table-names.ts',
  'table_names_config',
  0
)
ON CONFLICT (task_type) DO NOTHING;

-- 2. Allow repo-level queue items: entity_id nullable (table-names-config is one per repo, no entity)
ALTER TABLE crud_api_generation_queue
  ALTER COLUMN entity_id DROP NOT NULL;

-- 3. Unique constraint: at most one repo-level item per (project, repo, task) when entity_id is null
CREATE UNIQUE INDEX IF NOT EXISTS idx_crud_api_queue_repo_level_task
  ON crud_api_generation_queue (project_id, repo_id, task_id)
  WHERE entity_id IS NULL;

COMMENT ON INDEX idx_crud_api_queue_repo_level_task IS 'One table-names-config (or other repo-level task) queue item per repo';
