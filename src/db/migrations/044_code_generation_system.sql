-- ============================================
-- Code Generation System - Complete Migration
-- ============================================

-- 1. Create table for available code generation tasks
CREATE TABLE IF NOT EXISTS data_entity_generation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  output_path_template TEXT NOT NULL,
  required_conventions_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  required_examples_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for sorting
CREATE INDEX IF NOT EXISTS idx_data_entity_generation_tasks_sort_order 
  ON data_entity_generation_tasks(sort_order);

-- Add index for task_type lookups
CREATE INDEX IF NOT EXISTS idx_data_entity_generation_tasks_task_type 
  ON data_entity_generation_tasks(task_type);

-- 2. Create table for user's selected code generation tasks per entity
CREATE TABLE IF NOT EXISTS data_entity_selected_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL REFERENCES data_entity(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES data_entity_generation_tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  agent_id TEXT,
  pr_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, task_id)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_entity_selected_tasks_entity_id 
  ON data_entity_selected_tasks(entity_id);

CREATE INDEX IF NOT EXISTS idx_data_entity_selected_tasks_status 
  ON data_entity_selected_tasks(status);

CREATE INDEX IF NOT EXISTS idx_data_entity_selected_tasks_agent_id 
  ON data_entity_selected_tasks(agent_id) 
  WHERE agent_id IS NOT NULL;

-- 3. Seed initial code generation tasks
INSERT INTO data_entity_generation_tasks (
  name, 
  task_type, 
  description, 
  prompt_template, 
  output_path_template, 
  required_conventions_tags, 
  required_examples_tags, 
  sort_order
) VALUES
(
  'Create model file',
  'model',
  'TypeScript type definition for the entity',
  '# Task
Create a TypeScript model file at {{outputPath}} for the {{entityName}} entity.

# Conventions
{{conventions}}

# Example Pattern
{{examples}}

# Entity Definition
Name: {{entityName}}
Table: {{tableName}}
Fields:
{{fields}}

# Requirements
- Export a type named {{entityName}}
- Include all fields listed above with correct TypeScript types
- Follow the example pattern shown above
- Use proper TypeScript types (string for text/uuid, number for integers, boolean for booleans)
- Add `| null` for nullable fields
- Do not add any additional fields or logic',
  'src/model/{{entityNameLower}}.ts',
  ARRAY['typescript', 'model'],
  ARRAY['model'],
  1
),
(
  'Create database migration',
  'migration',
  'SQL migration file to create the database table',
  '# Task
Create a PostgreSQL migration file at {{outputPath}} to create the {{tableName}} table.

# Conventions
{{conventions}}

# Example Pattern
{{examples}}

# Entity Definition
Name: {{entityName}}
Table: {{tableName}}
Fields:
{{fields}}

# Requirements
- Create table with all fields listed above
- Use proper PostgreSQL types (TEXT, UUID, INTEGER, BOOLEAN, TIMESTAMPTZ)
- Add NOT NULL constraints for non-nullable fields
- Add DEFAULT uuid_generate_v4() for id field
- Add DEFAULT NOW() for created_at and updated_at fields
- Follow the example pattern shown above',
  'migrations/{{timestamp}}_create_{{tableName}}_table.sql',
  ARRAY['sql', 'supabase', 'migration'],
  ARRAY['migration'],
  2
);
