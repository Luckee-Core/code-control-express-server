-- ============================================================================
-- Task Categories - Admin-managed code generation task types
-- Examples: CRUD API, Data Model, ARD Documentation, Redux Slice, etc.
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  app_type TEXT NOT NULL CHECK (app_type IN ('express', 'nextjs', 'react-native')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, app_type)
);

CREATE INDEX IF NOT EXISTS idx_task_categories_app_type ON task_categories(app_type);
CREATE INDEX IF NOT EXISTS idx_task_categories_active ON task_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_task_categories_sort ON task_categories(app_type, sort_order);

CREATE TRIGGER update_task_categories_updated_at BEFORE UPDATE ON task_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE task_categories IS 'Admin-managed task categories for code generation (CRUD API, Data Model, ARD, Redux Slice, etc.)';
COMMENT ON COLUMN task_categories.name IS 'Task category name (e.g., CRUD API, Data Model, ARD Documentation)';
COMMENT ON COLUMN task_categories.app_type IS 'Application type this task category applies to';
COMMENT ON COLUMN task_categories.sort_order IS 'Display order in UI';
COMMENT ON COLUMN task_categories.is_active IS 'Whether this task category is currently active';

-- ============================================================================
-- Seed Initial Task Categories
-- ============================================================================

-- Express (Backend) Task Categories
INSERT INTO task_categories (name, description, app_type, sort_order) VALUES
  (
    'CRUD API',
    'Database CRUD operations (get-all, get-by-id, create, update, delete, router, index.ts)',
    'express',
    1
  ),
  (
    'Data Model',
    'SQL migrations and database schema definitions',
    'express',
    2
  ),
  (
    'ARD Documentation',
    'Architecture Decision Records and technical documentation',
    'express',
    3
  );

-- Next.js (Frontend) Task Categories
INSERT INTO task_categories (name, description, app_type, sort_order) VALUES
  (
    'Redux Slice',
    'Redux state management (builders, dumps, current, thunks)',
    'nextjs',
    1
  ),
  (
    'API Client',
    'Frontend API client functions',
    'nextjs',
    2
  ),
  (
    'Next.js Page',
    'App router pages and components',
    'nextjs',
    3
  );
