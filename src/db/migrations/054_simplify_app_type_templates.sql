-- ============================================================================
-- Simplify app_type_templates: phases keyed by repo_type
-- Remove entity_templates and platform_config - entities and repos are user-defined
-- ============================================================================

-- 1. Make entity_templates and platform_config nullable
ALTER TABLE app_type_templates
ALTER COLUMN entity_templates DROP NOT NULL,
ALTER COLUMN platform_config DROP NOT NULL;

-- 2. Update marketplace template: new build_phases structure, clear entity/platform
UPDATE app_type_templates
SET
  entity_templates = NULL,
  platform_config = NULL,
  build_phases = '{
    "mobile": [
      {"id": "data_model", "name": "Data Model", "description": "Generate models and migrations", "order": 1, "tasks": ["model", "migration"]},
      {"id": "api_integration", "name": "API Integration", "description": "API client and data fetching", "order": 2, "tasks": ["api_routes"]},
      {"id": "screens", "name": "Screens & Navigation", "description": "Screen components and navigation", "order": 3, "tasks": ["table_component"]},
      {"id": "state_management", "name": "State Management", "description": "Redux/store setup", "order": 4, "tasks": ["detail_page"]}
    ],
    "express": [
      {"id": "data_model", "name": "Data Model", "description": "Generate models and migrations", "order": 1, "tasks": ["model", "migration"]},
      {"id": "crud_api", "name": "CRUD API", "description": "Generate API routes and endpoints", "order": 2, "tasks": ["api_routes"]},
      {"id": "business_logic", "name": "Business Logic", "description": "Custom logic and integrations", "order": 3}
    ],
    "web": [
      {"id": "data_model", "name": "Data Model", "description": "Generate models and types", "order": 1, "tasks": ["model"]},
      {"id": "api_integration", "name": "API Integration", "description": "API client and data fetching", "order": 2, "tasks": ["api_routes"]},
      {"id": "pages", "name": "Pages & Routes", "description": "Page components and routing", "order": 3, "tasks": ["table_component"]},
      {"id": "components", "name": "Components", "description": "Reusable components", "order": 4, "tasks": ["detail_page"]}
    ]
  }'::jsonb,
  updated_at = NOW()
WHERE app_type = 'marketplace';
