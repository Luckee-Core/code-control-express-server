-- ============================================================================
-- Create CRUD API Tasks Table
-- Defines individual file generation tasks for CRUD operations
-- ============================================================================

-- 1. Create crud_api_tasks table
CREATE TABLE IF NOT EXISTS crud_api_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  task_type TEXT NOT NULL UNIQUE,
  description TEXT,
  prompt_template TEXT NOT NULL,
  output_path_template TEXT NOT NULL,
  operation_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crud_api_tasks_operation_key ON crud_api_tasks(operation_key);
CREATE INDEX IF NOT EXISTS idx_crud_api_tasks_sort_order ON crud_api_tasks(sort_order);

CREATE TRIGGER update_crud_api_tasks_updated_at BEFORE UPDATE ON crud_api_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE crud_api_tasks IS 'CRUD API file generation task templates';
COMMENT ON COLUMN crud_api_tasks.task_type IS 'Unique identifier for the task type (e.g., crud_get_all)';
COMMENT ON COLUMN crud_api_tasks.operation_key IS 'Operation identifier: get-all, get-by-id, create, update, delete, router, index';

-- 2. Seed CRUD API task templates
INSERT INTO crud_api_tasks (
  name,
  task_type,
  description,
  prompt_template,
  output_path_template,
  operation_key,
  sort_order
) VALUES
(
  'Get All',
  'crud_get_all',
  'Generate get-all.ts CRUD function',
  '# Generate Get All Function for {{entity_name}}

**Entity**: {{entity_name}}
**Table**: {{table_name}}
**File**: src/data/{{entity_slug}}/get-all.ts

## Task

Create a TypeScript function that retrieves all {{entity_name}} records from the database.

## Entity Schema

```typescript
export type {{entity_name}} = {
  id: string;
{{entity_fields}}
  created_at: string;
  updated_at: string;
};
```

## Expected Output

```typescript
/**
 * Get All {{entity_name}}
 * Retrieves all {{entity_name}} records from the database
 */

import { SupabaseClient } from ''@supabase/supabase-js'';

export type {{entity_name}} = {
  id: string;
{{entity_fields}}
  created_at: string;
  updated_at: string;
};

export const getAll{{entity_name}} = async (
  supabase: SupabaseClient
): Promise<{{entity_name}}[]> => {
  const { data, error } = await supabase
    .from(''{{table_name}}'')
    .select(''*'')
    .order(''created_at'', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch {{entity_name}}: ${error.message}`);
  }

  return data || [];
};
```

## Conventions to Follow

{{conventions}}

## Requirements

- Export the type definition and function
- Use SupabaseClient as first parameter
- Return Promise<{{entity_name}}[]>
- Order by created_at descending
- Throw errors (don''t return null)
- Add JSDoc comment',
  'src/data/{{entity_slug}}/get-all.ts',
  'get-all',
  1
),
(
  'Get By ID',
  'crud_get_by_id',
  'Generate get-by-id.ts CRUD function',
  '# Generate Get By ID Function for {{entity_name}}

**Entity**: {{entity_name}}
**Table**: {{table_name}}
**File**: src/data/{{entity_slug}}/get-by-id.ts

## Task

Create a TypeScript function that retrieves a single {{entity_name}} by ID.

## Expected Output

```typescript
/**
 * Get {{entity_name}} By ID
 * Retrieves a single {{entity_name}} record by its ID
 */

import { SupabaseClient } from ''@supabase/supabase-js'';
import { {{entity_name}} } from ''./get-all'';

export const get{{entity_name}}ById = async (
  supabase: SupabaseClient,
  id: string
): Promise<{{entity_name}} | null> => {
  const { data, error } = await supabase
    .from(''{{table_name}}'')
    .select(''*'')
    .eq(''id'', id)
    .single();

  if (error) {
    if (error.code === ''PGRST116'') return null;
    throw new Error(`Failed to fetch {{entity_name}}: ${error.message}`);
  }

  return data;
};
```

## Conventions to Follow

{{conventions}}

## Requirements

- Import type from get-all.ts
- Use SupabaseClient as first parameter
- Accept id as second parameter
- Return Promise<{{entity_name}} | null>
- Handle PGRST116 error (not found) by returning null
- Throw other errors
- Add JSDoc comment',
  'src/data/{{entity_slug}}/get-by-id.ts',
  'get-by-id',
  2
),
(
  'Create',
  'crud_create',
  'Generate create.ts CRUD function',
  '# Generate Create Function for {{entity_name}}

**Entity**: {{entity_name}}
**Table**: {{table_name}}
**File**: src/data/{{entity_slug}}/create.ts

## Task

Create a TypeScript function that creates a new {{entity_name}} record.

## Entity Schema

```typescript
{{entity_fields}}
```

## Expected Output

```typescript
/**
 * Create {{entity_name}}
 * Creates a new {{entity_name}} record in the database
 */

import { SupabaseClient } from ''@supabase/supabase-js'';
import { {{entity_name}} } from ''./get-all'';

export type Create{{entity_name}}Input = {
{{input_fields}}
};

export const create{{entity_name}} = async (
  supabase: SupabaseClient,
  input: Create{{entity_name}}Input
): Promise<{{entity_name}}> => {
  const { data, error } = await supabase
    .from(''{{table_name}}'')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create {{entity_name}}: ${error.message}`);
  }

  return data;
};
```

## Conventions to Follow

{{conventions}}

## Requirements

- Import type from get-all.ts
- Define Create{{entity_name}}Input type (exclude id, created_at, updated_at)
- Use SupabaseClient as first parameter
- Accept input object as second parameter
- Return Promise<{{entity_name}}>
- Use .select().single() after insert
- Throw errors
- Add JSDoc comment',
  'src/data/{{entity_slug}}/create.ts',
  'create',
  3
),
(
  'Update',
  'crud_update',
  'Generate update.ts CRUD function',
  '# Generate Update Function for {{entity_name}}

**Entity**: {{entity_name}}
**Table**: {{table_name}}
**File**: src/data/{{entity_slug}}/update.ts

## Task

Create a TypeScript function that updates an existing {{entity_name}} record.

## Expected Output

```typescript
/**
 * Update {{entity_name}}
 * Updates an existing {{entity_name}} record in the database
 */

import { SupabaseClient } from ''@supabase/supabase-js'';
import { {{entity_name}} } from ''./get-all'';
import { Create{{entity_name}}Input } from ''./create'';

export type Update{{entity_name}}Input = Partial<Create{{entity_name}}Input>;

export const update{{entity_name}} = async (
  supabase: SupabaseClient,
  id: string,
  input: Update{{entity_name}}Input
): Promise<{{entity_name}}> => {
  const { data, error } = await supabase
    .from(''{{table_name}}'')
    .update(input)
    .eq(''id'', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update {{entity_name}}: ${error.message}`);
  }

  return data;
};
```

## Conventions to Follow

{{conventions}}

## Requirements

- Import types from get-all.ts and create.ts
- Define Update{{entity_name}}Input as Partial<Create{{entity_name}}Input>
- Use SupabaseClient as first parameter
- Accept id and input as parameters
- Return Promise<{{entity_name}}>
- Use .select().single() after update
- Throw errors
- Add JSDoc comment',
  'src/data/{{entity_slug}}/update.ts',
  'update',
  4
),
(
  'Delete',
  'crud_delete',
  'Generate delete.ts CRUD function',
  '# Generate Delete Function for {{entity_name}}

**Entity**: {{entity_name}}
**Table**: {{table_name}}
**File**: src/data/{{entity_slug}}/delete.ts

## Task

Create a TypeScript function that deletes a {{entity_name}} record.

## Expected Output

```typescript
/**
 * Delete {{entity_name}}
 * Deletes a {{entity_name}} record from the database
 */

import { SupabaseClient } from ''@supabase/supabase-js'';

export const delete{{entity_name}} = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from(''{{table_name}}'')
    .delete()
    .eq(''id'', id);

  if (error) {
    throw new Error(`Failed to delete {{entity_name}}: ${error.message}`);
  }
};
```

## Conventions to Follow

{{conventions}}

## Requirements

- Use SupabaseClient as first parameter
- Accept id as second parameter
- Return Promise<void>
- Throw errors
- Add JSDoc comment',
  'src/data/{{entity_slug}}/delete.ts',
  'delete',
  5
),
(
  'Router',
  'crud_router',
  'Generate router.ts with Express endpoints',
  '# Generate Express Router for {{entity_name}}

**Entity**: {{entity_name}}
**Table**: {{table_name}}
**File**: src/data/{{entity_slug}}/router.ts
**Mount Path**: /api/data/{{entity_slug}}

## Task

Create an Express router with all CRUD endpoints for {{entity_name}}.

## Expected Output

```typescript
import { Router, Request, Response } from ''express'';
import { getSupabaseClient } from ''../../db/supabase-client'';
import {
  getAll{{entity_name}},
  get{{entity_name}}ById,
  create{{entity_name}},
  update{{entity_name}},
  delete{{entity_name}},
} from ''./index'';

export const create{{entity_name}}Router = (): Router => {
  const router = Router();

  // GET /api/data/{{entity_slug}}
  router.get(''/'', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getSupabaseClient();
      const items = await getAll{{entity_name}}(supabase);
      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
        message: ''{{entity_name}} retrieved successfully'',
      });
    } catch (error) {
      console.error(''❌ Error in GET /api/data/{{entity_slug}}:'', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ''Unknown error'',
        message: ''Failed to fetch {{entity_name}}'',
      });
    }
  });

  // GET /api/data/{{entity_slug}}/:id
  router.get(''/:id'', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: ''Invalid ID'',
          message: ''ID must be a single string'',
        });
        return;
      }
      const supabase = getSupabaseClient();
      const item = await get{{entity_name}}ById(supabase, id);
      if (!item) {
        res.status(404).json({
          success: false,
          error: ''Not Found'',
          message: `{{entity_name}} with ID ''${id}'' not found`,
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: item,
        message: ''{{entity_name}} retrieved successfully'',
      });
    } catch (error) {
      console.error(''❌ Error in GET /api/data/{{entity_slug}}/:id:'', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ''Unknown error'',
        message: ''Failed to fetch {{entity_name}}'',
      });
    }
  });

  // POST /api/data/{{entity_slug}}
  router.post(''/'', async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body;
      // Add validation for required fields here
      const supabase = getSupabaseClient();
      const item = await create{{entity_name}}(supabase, input);
      res.status(201).json({
        success: true,
        data: item,
        message: ''{{entity_name}} created successfully'',
      });
    } catch (error) {
      console.error(''❌ Error in POST /api/data/{{entity_slug}}:'', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ''Unknown error'',
        message: ''Failed to create {{entity_name}}'',
      });
    }
  });

  // PATCH /api/data/{{entity_slug}}/:id
  router.patch(''/:id'', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const input = req.body;
      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: ''Invalid ID'',
          message: ''ID must be a single string'',
        });
        return;
      }
      const supabase = getSupabaseClient();
      const item = await update{{entity_name}}(supabase, id, input);
      res.status(200).json({
        success: true,
        data: item,
        message: ''{{entity_name}} updated successfully'',
      });
    } catch (error) {
      console.error(''❌ Error in PATCH /api/data/{{entity_slug}}/:id:'', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ''Unknown error'',
        message: ''Failed to update {{entity_name}}'',
      });
    }
  });

  // DELETE /api/data/{{entity_slug}}/:id
  router.delete(''/:id'', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({
          success: false,
          error: ''Invalid ID'',
          message: ''ID must be a single string'',
        });
        return;
      }
      const supabase = getSupabaseClient();
      await delete{{entity_name}}(supabase, id);
      res.status(200).json({
        success: true,
        message: ''{{entity_name}} deleted successfully'',
      });
    } catch (error) {
      console.error(''❌ Error in DELETE /api/data/{{entity_slug}}/:id:'', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ''Unknown error'',
        message: ''Failed to delete {{entity_name}}'',
      });
    }
  });

  return router;
};
```

## Conventions to Follow

{{conventions}}

## Requirements

- Export create{{entity_name}}Router factory function
- Import all CRUD functions from index
- Use getSupabaseClient() in each handler
- Return consistent response format: { success, data?, error?, message? }
- Use status codes: 200, 201, 400, 404, 500
- Validate ID parameter (not array)
- Use emoji logging (❌ for errors)
- Add JSDoc comment to router factory',
  'src/data/{{entity_slug}}/router.ts',
  'router',
  6
),
(
  'Index',
  'crud_index',
  'Generate index.ts barrel export',
  '# Generate Index Barrel Export for {{entity_name}}

**Entity**: {{entity_name}}
**File**: src/data/{{entity_slug}}/index.ts

## Task

Create a barrel export file that re-exports all CRUD functions and types.

## Expected Output

```typescript
export * from ''./get-all'';
export * from ''./get-by-id'';
export * from ''./create'';
export * from ''./update'';
export * from ''./delete'';
```

## Conventions to Follow

{{conventions}}

## Requirements

- Export all functions from CRUD files
- Use export * syntax
- One export per line
- Follow alphabetical order (create, delete, get-all, get-by-id, update)',
  'src/data/{{entity_slug}}/index.ts',
  'index',
  7
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify CRUD API tasks created
SELECT 'CRUD API Tasks Created:' as status, COUNT(*) as count FROM crud_api_tasks;

-- List all CRUD API tasks
SELECT 
  operation_key,
  name,
  output_path_template,
  sort_order
FROM crud_api_tasks
ORDER BY sort_order;
