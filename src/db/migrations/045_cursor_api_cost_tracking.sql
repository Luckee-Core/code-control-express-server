-- ============================================
-- Cursor API Cost Tracking - 3-Table Pattern
-- ============================================
-- Tracks Cursor API calls for code generation:
-- request (what was asked) -> exchange (API call + cost) -> response (result)

-- 1. cursor_generation_responses (create first - no FK to requests/exchanges)
CREATE TABLE IF NOT EXISTS cursor_generation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_url TEXT,
  pr_number INTEGER,
  branch_name TEXT,
  files_changed JSONB,
  lines_added INTEGER,
  lines_removed INTEGER,
  agent_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. cursor_generation_requests (captures what was requested)
CREATE TABLE IF NOT EXISTS cursor_generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES project_repos(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES data_entity(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES data_entity_generation_tasks(id) ON DELETE CASCADE,
  selected_task_id UUID NOT NULL REFERENCES data_entity_selected_tasks(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. cursor_generation_exchanges (tracks Cursor API call and costs)
CREATE TABLE IF NOT EXISTS cursor_generation_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_id UUID NOT NULL REFERENCES cursor_generation_requests(id) ON DELETE CASCADE,
  response_id UUID REFERENCES cursor_generation_responses(id) ON DELETE SET NULL,
  agent_id TEXT NOT NULL,
  model_used TEXT,
  api_calls_count INTEGER DEFAULT 1,
  duration_seconds INTEGER,
  cost_estimate NUMERIC(10,4),
  repository TEXT NOT NULL,
  branch_ref TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cursor_requests_project ON cursor_generation_requests(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cursor_requests_entity ON cursor_generation_requests(entity_id);
CREATE INDEX IF NOT EXISTS idx_cursor_exchanges_request ON cursor_generation_exchanges(request_id);
CREATE INDEX IF NOT EXISTS idx_cursor_exchanges_agent ON cursor_generation_exchanges(agent_id);
CREATE INDEX IF NOT EXISTS idx_cursor_exchanges_user_created ON cursor_generation_exchanges(user_id, created_at DESC);

-- 4. Add cursor_exchange_id to data_entity_selected_tasks for easy lookup
ALTER TABLE data_entity_selected_tasks
  ADD COLUMN IF NOT EXISTS cursor_exchange_id UUID REFERENCES cursor_generation_exchanges(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_data_entity_selected_tasks_cursor_exchange 
  ON data_entity_selected_tasks(cursor_exchange_id);
