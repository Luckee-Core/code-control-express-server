-- ============================================================================
-- Add build_foundation phase (Phase 0) to all app_type_templates
-- This phase appears BEFORE data_model and handles ARD generation
-- ============================================================================

-- Update marketplace template: Add build_foundation as Phase 0 (order: 0)
UPDATE app_type_templates
SET
  build_phases = jsonb_set(
    build_phases,
    '{mobile}',
    (
      SELECT jsonb_agg(
        CASE 
          WHEN elem->>'order' IS NOT NULL THEN 
            jsonb_set(elem, '{order}', to_jsonb((elem->>'order')::int + 1))
          ELSE elem
        END
      )
      FROM jsonb_array_elements(build_phases->'mobile') AS elem
    )
  ),
  updated_at = NOW()
WHERE app_type = 'marketplace';

UPDATE app_type_templates
SET
  build_phases = jsonb_set(
    build_phases,
    '{express}',
    (
      SELECT jsonb_agg(
        CASE 
          WHEN elem->>'order' IS NOT NULL THEN 
            jsonb_set(elem, '{order}', to_jsonb((elem->>'order')::int + 1))
          ELSE elem
        END
      )
      FROM jsonb_array_elements(build_phases->'express') AS elem
    )
  ),
  updated_at = NOW()
WHERE app_type = 'marketplace';

UPDATE app_type_templates
SET
  build_phases = jsonb_set(
    build_phases,
    '{web}',
    (
      SELECT jsonb_agg(
        CASE 
          WHEN elem->>'order' IS NOT NULL THEN 
            jsonb_set(elem, '{order}', to_jsonb((elem->>'order')::int + 1))
          ELSE elem
        END
      )
      FROM jsonb_array_elements(build_phases->'web') AS elem
    )
  ),
  updated_at = NOW()
WHERE app_type = 'marketplace';

-- Now prepend build_foundation phase to each repo_type
UPDATE app_type_templates
SET
  build_phases = jsonb_set(
    build_phases,
    '{mobile}',
    jsonb_insert(
      build_phases->'mobile',
      '{0}',
      '{
        "id": "build_foundation",
        "name": "Build Foundation",
        "description": "Generate architecture documentation and coding conventions",
        "order": 0,
        "tasks": ["ard_agents_md", "ard_architecture_readme", "ard_redux_patterns", "ard_file_organization", "ard_api_conventions", "ard_styling_rules", "ard_constants_utilities"]
      }'::jsonb
    )
  ),
  updated_at = NOW()
WHERE app_type = 'marketplace';

UPDATE app_type_templates
SET
  build_phases = jsonb_set(
    build_phases,
    '{express}',
    jsonb_insert(
      build_phases->'express',
      '{0}',
      '{
        "id": "build_foundation",
        "name": "Build Foundation",
        "description": "Generate architecture documentation and coding conventions",
        "order": 0,
        "tasks": ["ard_agents_md", "ard_architecture_readme", "ard_redux_patterns", "ard_file_organization", "ard_api_conventions", "ard_constants_utilities"]
      }'::jsonb
    )
  ),
  updated_at = NOW()
WHERE app_type = 'marketplace';

UPDATE app_type_templates
SET
  build_phases = jsonb_set(
    build_phases,
    '{web}',
    jsonb_insert(
      build_phases->'web',
      '{0}',
      '{
        "id": "build_foundation",
        "name": "Build Foundation",
        "description": "Generate architecture documentation and coding conventions",
        "order": 0,
        "tasks": ["ard_agents_md", "ard_architecture_readme", "ard_redux_patterns", "ard_file_organization", "ard_styling_rules", "ard_constants_utilities"]
      }'::jsonb
    )
  ),
  updated_at = NOW()
WHERE app_type = 'marketplace';

-- Update all existing repos to start at build_foundation phase
UPDATE project_repos
SET 
  current_phase = 'build_foundation',
  phase_status = 'not_started',
  updated_at = NOW()
WHERE current_phase IS NULL OR current_phase = 'data_model';
