-- Customer projects and repos (Code Control)
-- Note: `projects` is a separate THT table (learning blueprints). Build projects live in customer_projects.

CREATE TABLE IF NOT EXISTS customer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  app_type VARCHAR(64),
  app_type_config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_projects_customer_id ON customer_projects(customer_id);
CREATE TRIGGER update_customer_projects_updated_at BEFORE UPDATE ON customer_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS customer_project_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  project_id UUID NOT NULL REFERENCES customer_projects(id) ON DELETE CASCADE,
  repo_type VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  repo_url TEXT NOT NULL,
  clone_url TEXT,
  current_phase VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, repo_type)
);

CREATE INDEX IF NOT EXISTS idx_customer_project_repos_project_id ON customer_project_repos(project_id);
CREATE INDEX IF NOT EXISTS idx_customer_project_repos_customer_id ON customer_project_repos(customer_id);
CREATE TRIGGER update_customer_project_repos_updated_at
  BEFORE UPDATE ON customer_project_repos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
