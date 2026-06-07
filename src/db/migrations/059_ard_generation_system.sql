-- ============================================================================
-- ARD Generation System - Phase 0: Build Foundation
-- Creates build profiles, repo build profiles, and ARD generation queue
-- ============================================================================

-- 1. Build Profiles - Template profiles for repo types (Express, Next.js, etc.)
CREATE TABLE IF NOT EXISTS build_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stack_type TEXT NOT NULL CHECK (stack_type IN ('express', 'nextjs', 'react-native')),
  is_template BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_build_profiles_stack_type ON build_profiles(stack_type);
CREATE INDEX IF NOT EXISTS idx_build_profiles_is_template ON build_profiles(is_template);

CREATE TRIGGER update_build_profiles_updated_at BEFORE UPDATE ON build_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE build_profiles IS 'Template build profiles that define convention sets for different repo types';
COMMENT ON COLUMN build_profiles.stack_type IS 'Type of stack: express, nextjs, react-native';
COMMENT ON COLUMN build_profiles.is_template IS 'Whether this is a reusable template or project-specific';

-- 2. Build Profile Conventions - Many-to-many junction table
CREATE TABLE IF NOT EXISTS build_profile_conventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_profile_id UUID NOT NULL REFERENCES build_profiles(id) ON DELETE CASCADE,
  build_convention_id UUID NOT NULL REFERENCES build_conventions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(build_profile_id, build_convention_id)
);

CREATE INDEX IF NOT EXISTS idx_build_profile_conventions_profile_id ON build_profile_conventions(build_profile_id);
CREATE INDEX IF NOT EXISTS idx_build_profile_conventions_convention_id ON build_profile_conventions(build_convention_id);
CREATE INDEX IF NOT EXISTS idx_build_profile_conventions_order ON build_profile_conventions(build_profile_id, order_index);

COMMENT ON TABLE build_profile_conventions IS 'Links build profiles to conventions with ordering';
COMMENT ON COLUMN build_profile_conventions.order_index IS 'Display order within the profile';
COMMENT ON COLUMN build_profile_conventions.is_required IS 'Whether this convention can be toggled off';

-- 3. Repo Build Profiles - Assigned profiles per repository
CREATE TABLE IF NOT EXISTS repo_build_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES project_repos(id) ON DELETE CASCADE,
  build_profile_id UUID NOT NULL REFERENCES build_profiles(id),
  name TEXT NOT NULL,
  stack_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(repo_id)
);

CREATE INDEX IF NOT EXISTS idx_repo_build_profiles_project_id ON repo_build_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_repo_build_profiles_repo_id ON repo_build_profiles(repo_id);
CREATE INDEX IF NOT EXISTS idx_repo_build_profiles_profile_id ON repo_build_profiles(build_profile_id);

CREATE TRIGGER update_repo_build_profiles_updated_at BEFORE UPDATE ON repo_build_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE repo_build_profiles IS 'Build profiles assigned to specific repositories';
COMMENT ON COLUMN repo_build_profiles.project_id IS 'Stored for easy filtering - get all repos for a project';
COMMENT ON COLUMN repo_build_profiles.repo_id IS 'The repository this profile is assigned to';

-- 4. ARD Generation Queue - Queue for ARD/documentation generation tasks
CREATE TABLE IF NOT EXISTS ard_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES project_repos(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES data_entity_generation_tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  cursor_exchange_id UUID REFERENCES cursor_generation_exchanges(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ard_generation_queue_project_id ON ard_generation_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_ard_generation_queue_repo_id ON ard_generation_queue(repo_id);
CREATE INDEX IF NOT EXISTS idx_ard_generation_queue_status ON ard_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_ard_generation_queue_scheduled ON ard_generation_queue(scheduled_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_ard_generation_queue_exchange_id ON ard_generation_queue(cursor_exchange_id) WHERE cursor_exchange_id IS NOT NULL;

CREATE TRIGGER update_ard_generation_queue_updated_at BEFORE UPDATE ON ard_generation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ard_generation_queue IS 'Queue for ARD/documentation generation tasks - processes 1 at a time';
COMMENT ON COLUMN ard_generation_queue.task_id IS 'References ARD task type in data_entity_generation_tasks (e.g., ard_agents_md)';
COMMENT ON COLUMN ard_generation_queue.status IS 'Queue status: queued, processing, completed, failed';

-- ============================================================================
-- Seed Data: Build Profiles
-- ============================================================================

-- Insert Express Server Build Profile
INSERT INTO build_profiles (id, name, description, stack_type, is_template)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Express Server Build',
  'Backend API server with PostgreSQL, TypeScript, and Express. Includes Redux patterns, API conventions, and database utilities.',
  'express',
  true
);

-- Insert Next.js Build Profile
INSERT INTO build_profiles (id, name, description, stack_type, is_template)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Next.js Build',
  'Frontend web application with Next.js, React, TypeScript, and Redux. Includes component patterns, styling rules, and state management.',
  'nextjs',
  true
);

-- ============================================================================
-- Seed Data: Link Conventions to Build Profiles
-- ============================================================================

-- Express Server Build Conventions (32 conventions)
-- Tags: global, redux, api, utils, constants
INSERT INTO build_profile_conventions (build_profile_id, build_convention_id, order_index, is_required)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  id,
  ROW_NUMBER() OVER (ORDER BY 
    CASE 
      WHEN 'global' = ANY(tags) THEN 1
      WHEN 'redux' = ANY(tags) THEN 2
      WHEN 'api' = ANY(tags) THEN 3
      WHEN 'utils' = ANY(tags) THEN 4
      WHEN 'constants' = ANY(tags) THEN 5
      ELSE 6
    END,
    name
  )::INTEGER,
  true
FROM build_conventions
WHERE tags && ARRAY['global', 'redux', 'api', 'utils', 'constants'];

-- Next.js Build Conventions (28 conventions)
-- Tags: global, nextjs, redux, utils, constants
INSERT INTO build_profile_conventions (build_profile_id, build_convention_id, order_index, is_required)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  id,
  ROW_NUMBER() OVER (ORDER BY 
    CASE 
      WHEN 'global' = ANY(tags) THEN 1
      WHEN 'nextjs' = ANY(tags) THEN 2
      WHEN 'redux' = ANY(tags) THEN 3
      WHEN 'utils' = ANY(tags) THEN 4
      WHEN 'constants' = ANY(tags) THEN 5
      ELSE 6
    END,
    name
  )::INTEGER,
  true
FROM build_conventions
WHERE tags && ARRAY['global', 'nextjs', 'redux', 'utils', 'constants'];

-- ============================================================================
-- Seed Data: ARD Task Types
-- ============================================================================

-- ARD task types for generating .cursor/ documentation files
INSERT INTO data_entity_generation_tasks (
  name,
  task_type,
  description,
  prompt_template,
  output_path_template,
  required_conventions_tags,
  required_examples_tags,
  sort_order
) VALUES
(
  'Generate AGENTS.md',
  'ard_agents_md',
  'Generate .cursor/rules/AGENTS.md - main rules file',
  '# Task
Generate a .cursor/rules/AGENTS.md file for a {{stackType}} repository.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions to Follow
{{conventions}}

# Requirements
1. Use NEVER/ALWAYS/MUST directive language
2. Reference architecture docs in .cursor/architecture/
3. Include quick reference section linking to specific ADRs
4. Keep it concise (under 100 lines)
5. Group rules by domain (Redux, API, Files, Styling, etc.)

# Output Format
Output ONLY the markdown content for AGENTS.md, no explanations or meta-commentary.

# Example Structure
```markdown
# Project Rules

BEFORE implementing ANY feature, you MUST:
1. Read `.cursor/architecture/README.md`
2. Search `.cursor/architecture/` for relevant patterns
3. Follow examples EXACTLY as shown

## Non-Negotiable Rules
1. Redux: NEVER use createAsyncThunk. ALWAYS use AppThunk.
2. Files: ONE function per file. ALWAYS create index.ts.

## Quick Reference
- Redux patterns → `.cursor/architecture/001-redux-patterns.md`
- File organization → `.cursor/architecture/002-file-organization.md`
```',
  '.cursor/rules/AGENTS.md',
  ARRAY['global'],
  ARRAY[]::TEXT[],
  1
),
(
  'Generate Architecture README',
  'ard_architecture_readme',
  'Generate .cursor/architecture/README.md - index of all ADRs',
  '# Task
Generate a .cursor/architecture/README.md file that serves as an index for all architecture decision records.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Requirements
1. List all ADR files with brief descriptions
2. Explain the purpose of architecture documentation
3. Provide navigation links to each ADR
4. Keep it concise

# Output Format
Output ONLY the markdown content for README.md, no explanations.

# Example Structure
```markdown
# Architecture Documentation

This folder contains Architecture Decision Records (ADRs) that document our coding conventions and patterns.

## ADRs

1. [Redux Patterns](./001-redux-patterns.md) - State management with manual thunks
2. [File Organization](./002-file-organization.md) - One function per file, barrel exports
3. [API Conventions](./003-api-conventions.md) - API structure and error handling
```',
  '.cursor/architecture/README.md',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  2
),
(
  'Generate Redux Patterns ADR',
  'ard_redux_patterns',
  'Generate .cursor/architecture/001-redux-patterns.md',
  '# Task
Generate a .cursor/architecture/001-redux-patterns.md file documenting Redux patterns.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Group conventions by topic (Thunks, Reducers, State Structure)
2. For each convention, provide:
   - Rule statement with NEVER/ALWAYS/MUST
   - ✅ Correct example (3-5 lines of code)
   - ❌ Incorrect example (3-5 lines of code)
   - Reasoning (1 sentence why this matters)
3. Cross-reference related ADRs
4. Use proper code blocks with typescript syntax

# Output Format
Output ONLY the markdown content, no explanations.

# Example Structure
```markdown
# Redux Patterns

## Manual Thunks (NEVER createAsyncThunk)

✅ Correct:
\`\`\`typescript
export const getAllItemsThunk = (): AppThunk<Promise<200|400|500>> => {
  return async (dispatch, getState) => {
    // logic here
  };
};
\`\`\`

❌ Incorrect:
\`\`\`typescript
export const getAllItemsThunk = createAsyncThunk(''items/getAll'', async () => {
  // logic here
});
\`\`\`

**Reasoning:** Manual thunks provide better type safety and control.

## Related
- See [File Organization](./002-file-organization.md) for thunk file structure
```',
  '.cursor/architecture/001-redux-patterns.md',
  ARRAY['redux'],
  ARRAY[]::TEXT[],
  3
),
(
  'Generate File Organization ADR',
  'ard_file_organization',
  'Generate .cursor/architecture/002-file-organization.md',
  '# Task
Generate a .cursor/architecture/002-file-organization.md file documenting file organization patterns.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Document folder structure
2. One function per file rule with examples
3. Index.ts barrel export patterns
4. Import/export conventions
5. Include ✅/❌ examples for each pattern

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/002-file-organization.md',
  ARRAY['global', 'utils'],
  ARRAY[]::TEXT[],
  4
),
(
  'Generate API Conventions ADR',
  'ard_api_conventions',
  'Generate .cursor/architecture/003-api-conventions.md',
  '# Task
Generate a .cursor/architecture/003-api-conventions.md file documenting API patterns.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. API structure and organization
2. Error handling patterns
3. Status codes (200, 400, 500)
4. ApiResponse type usage
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/003-api-conventions.md',
  ARRAY['api'],
  ARRAY[]::TEXT[],
  5
),
(
  'Generate Styling Rules ADR',
  'ard_styling_rules',
  'Generate .cursor/architecture/004-styling-rules.md',
  '# Task
Generate a .cursor/architecture/004-styling-rules.md file documenting styling patterns.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Styles object pattern (no inline, no separate CSS files)
2. Template literal syntax
3. Component styling methodology
4. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/004-styling-rules.md',
  ARRAY['nextjs', 'global'],
  ARRAY[]::TEXT[],
  6
),
(
  'Generate Constants & Utilities ADR',
  'ard_constants_utilities',
  'Generate .cursor/architecture/005-constants-utilities.md',
  '# Task
Generate a .cursor/architecture/005-constants-utilities.md file documenting constants and utility patterns.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. When to extract utilities (2+ uses)
2. Constants organization by domain
3. Pure utility functions
4. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/005-constants-utilities.md',
  ARRAY['constants', 'utils'],
  ARRAY[]::TEXT[],
  7
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify build profiles created
SELECT 'Build Profiles Created:' as status, COUNT(*) as count FROM build_profiles;

-- Verify Express Server Build conventions count
SELECT 
  'Express Server Build Conventions:' as status,
  COUNT(*) as count 
FROM build_profile_conventions 
WHERE build_profile_id = '11111111-1111-1111-1111-111111111111';

-- Verify Next.js Build conventions count
SELECT 
  'Next.js Build Conventions:' as status,
  COUNT(*) as count 
FROM build_profile_conventions 
WHERE build_profile_id = '22222222-2222-2222-2222-222222222222';

-- Verify ARD task types created
SELECT 
  'ARD Task Types Created:' as status,
  COUNT(*) as count 
FROM data_entity_generation_tasks 
WHERE task_type LIKE 'ard_%';
