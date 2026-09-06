-- Drop codegen tables and columns from an existing THT-era Code Control database.
-- Safe to run on a fresh slim schema (uses IF EXISTS).

-- Codegen tables
DROP TABLE IF EXISTS convention_task_categories CASCADE;
DROP TABLE IF EXISTS step_task_categories CASCADE;
DROP TABLE IF EXISTS task_categories CASCADE;
DROP TABLE IF EXISTS build_steps CASCADE;
DROP TABLE IF EXISTS crud_api_generation_queue CASCADE;
DROP TABLE IF EXISTS crud_api_tasks CASCADE;
DROP TABLE IF EXISTS data_model_generation_queue CASCADE;
DROP TABLE IF EXISTS ard_generation_queue CASCADE;
DROP TABLE IF EXISTS ard_tasks CASCADE;
DROP TABLE IF EXISTS code_generation_queue CASCADE;
DROP TABLE IF EXISTS data_entity_selected_tasks CASCADE;
DROP TABLE IF EXISTS data_entity_generation_tasks CASCADE;
DROP TABLE IF EXISTS data_entity_operations CASCADE;
DROP TABLE IF EXISTS data_entity_field CASCADE;
DROP TABLE IF EXISTS data_entity CASCADE;
DROP TABLE IF EXISTS build_examples CASCADE;
DROP TABLE IF EXISTS build_conventions CASCADE;
DROP TABLE IF EXISTS app_type_templates CASCADE;
DROP TABLE IF EXISTS cursor_generation_exchanges CASCADE;
DROP TABLE IF EXISTS cursor_generation_requests CASCADE;
DROP TABLE IF EXISTS cursor_generation_responses CASCADE;
DROP TABLE IF EXISTS profile_assignments CASCADE;
DROP TABLE IF EXISTS project_platforms CASCADE;

-- Project / repo columns from guided pathway
ALTER TABLE customer_projects DROP COLUMN IF EXISTS app_type;
ALTER TABLE customer_projects DROP COLUMN IF EXISTS app_type_config;
ALTER TABLE customer_project_repos DROP COLUMN IF EXISTS current_phase;
ALTER TABLE customer_project_repos DROP COLUMN IF EXISTS phase_status;

-- Legacy table name from THT extract
ALTER TABLE IF EXISTS project_repos DROP COLUMN IF EXISTS current_phase;
ALTER TABLE IF EXISTS project_repos DROP COLUMN IF EXISTS phase_status;

ALTER TABLE customer_project_repos
  DROP CONSTRAINT IF EXISTS customer_project_repos_project_id_repo_type_key;

ALTER TABLE IF EXISTS project_repos
  DROP CONSTRAINT IF EXISTS project_repos_project_id_repo_type_key;

DROP TYPE IF EXISTS app_type;
