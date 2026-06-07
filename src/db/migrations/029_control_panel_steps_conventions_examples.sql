-- ============================================================================
-- Control panel: step tags/status + build conventions and examples
-- 1) customer_project_steps: tags, status, selected_example_ids
-- 2) build_conventions, build_examples tables (global, for orchestration)
-- ============================================================================

-- Step columns for orchestration
ALTER TABLE customer_project_steps
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'not-started',
  ADD COLUMN IF NOT EXISTS selected_example_ids TEXT[] DEFAULT '{}';

ALTER TABLE customer_project_steps
  DROP CONSTRAINT IF EXISTS chk_step_status;

ALTER TABLE customer_project_steps
  ADD CONSTRAINT chk_step_status CHECK (status IN ('not-started', 'in-progress', 'done'));

COMMENT ON COLUMN customer_project_steps.tags IS 'Tags for matching conventions (stack) and code examples';
COMMENT ON COLUMN customer_project_steps.status IS 'Step progress: not-started, in-progress, done';
COMMENT ON COLUMN customer_project_steps.selected_example_ids IS 'IDs of examples to include in generated context for this step';

-- Build conventions and code examples (global)
CREATE TABLE IF NOT EXISTS build_conventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  stack VARCHAR(64) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_build_conventions_stack ON build_conventions(stack);
CREATE TRIGGER update_build_conventions_updated_at BEFORE UPDATE ON build_conventions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS build_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  language VARCHAR(32) NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_build_examples_tags ON build_examples USING GIN(tags);
CREATE TRIGGER update_build_examples_updated_at BEFORE UPDATE ON build_examples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
