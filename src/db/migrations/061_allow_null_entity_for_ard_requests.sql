-- Allow ARD generation to use cursor_generation_requests without entity/selected_task
-- ARD tasks don't have an entity - they generate docs for the repo

ALTER TABLE cursor_generation_requests
  ALTER COLUMN entity_id DROP NOT NULL;

ALTER TABLE cursor_generation_requests
  ALTER COLUMN selected_task_id DROP NOT NULL;
