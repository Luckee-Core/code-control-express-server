-- Code Control: customer projects and linked GitHub repos

CREATE TABLE IF NOT EXISTS customer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_projects_customer_id ON customer_projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_projects_is_active ON customer_projects(is_active);

DROP TRIGGER IF EXISTS update_customer_projects_updated_at ON customer_projects;
CREATE TRIGGER update_customer_projects_updated_at
  BEFORE UPDATE ON customer_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS customer_project_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  project_id UUID NOT NULL REFERENCES customer_projects(id) ON DELETE CASCADE,
  repo_type VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  repo_url TEXT NOT NULL,
  clone_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_project_repos_project_id ON customer_project_repos(project_id);
CREATE INDEX IF NOT EXISTS idx_customer_project_repos_customer_id ON customer_project_repos(customer_id);

DROP TRIGGER IF EXISTS update_customer_project_repos_updated_at ON customer_project_repos;
CREATE TRIGGER update_customer_project_repos_updated_at
  BEFORE UPDATE ON customer_project_repos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
