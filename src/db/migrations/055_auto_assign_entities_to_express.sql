-- Auto-assign existing entities to express repo (backend server)
-- Entities without assigned_repo_ids get the project's express repo

UPDATE data_entity de
SET assigned_repo_ids = ARRAY[(
  SELECT cpr.id
  FROM project_repos cpr
  WHERE cpr.project_id = de.project_id
  AND cpr.repo_type = 'express'
  LIMIT 1
)]
WHERE (
  de.assigned_repo_ids IS NULL
  OR de.assigned_repo_ids = ARRAY[]::UUID[]
)
AND EXISTS (
  SELECT 1 FROM project_repos cpr
  WHERE cpr.project_id = de.project_id
  AND cpr.repo_type = 'express'
);
