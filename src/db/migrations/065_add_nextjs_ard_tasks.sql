-- ============================================================================
-- Next.js-Specific ARD Tasks
-- Adds architecture documentation tasks for Next.js projects
-- ============================================================================

-- Insert Next.js ARD Tasks
INSERT INTO ard_tasks (
  name,
  task_type,
  description,
  prompt_template,
  output_path_template,
  stack_type,
  sort_order
) VALUES
(
  'Generate AGENTS.md (Next.js)',
  'ard_nextjs_agents_md',
  'Generate .cursor/rules/AGENTS.md - main rules file for Next.js',
  '# Task
Generate a .cursor/rules/AGENTS.md file for a Next.js repository.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions to Follow
{{conventions}}

# Requirements
1. Use NEVER/ALWAYS/MUST directive language
2. Reference architecture docs in .cursor/architecture/
3. Include quick reference section linking to Next.js-specific ADRs
4. Keep it concise (under 100 lines)
5. Group rules by domain (Redux, Components, Styling, API, Files)

# Output Format
Output ONLY the markdown content for AGENTS.md, no explanations or meta-commentary.

# Example Structure
```markdown
# Next.js Project Rules

BEFORE implementing ANY feature, you MUST:
1. Read `.cursor/architecture/README.md`
2. Search `.cursor/architecture/` for relevant patterns
3. Follow examples EXACTLY as shown

## Non-Negotiable Rules
1. Redux: NEVER use createAsyncThunk. ALWAYS use AppThunk.
2. Files: ONE function per file. ALWAYS create index.ts.
3. Components: Features in src/packages/{feature}/. Shared UI in src/components/.
4. Styling: Styles object pattern. NO inline styles. NO separate CSS files.
5. Pages: Thin wrappers in app/. Logic in packages/.

## Quick Reference (Architecture + ADRs)
- Architecture entrypoint → `.cursor/architecture/README.md`
- Redux patterns → `.cursor/architecture/001-redux-patterns.md`
- Component composition → `.cursor/architecture/002-component-composition.md`
- Styling rules → `.cursor/architecture/003-styling-rules.md`
- API integration → `.cursor/architecture/004-api-integration.md`
- File organization → `.cursor/architecture/005-file-organization.md`
```',
  '.cursor/rules/AGENTS.md',
  'nextjs',
  1
),
(
  'Generate Architecture README (Next.js)',
  'ard_nextjs_architecture_readme',
  'Generate .cursor/architecture/README.md - index of all ADRs for Next.js',
  '# Task
Generate a .cursor/architecture/README.md file for a Next.js project that serves as an index for all architecture decision records.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Requirements
1. List all Next.js-specific ADR files with brief descriptions
2. Explain the purpose of architecture documentation
3. Provide navigation links to each ADR
4. Keep it concise

# Output Format
Output ONLY the markdown content for README.md, no explanations.

# Example Structure
```markdown
# Architecture Documentation

This folder contains Architecture Decision Records (ADRs) that document our Next.js coding conventions and patterns.

## Why ADRs?

ADRs help maintain consistency across the codebase by documenting:
- **What** patterns we use
- **Why** we chose them
- **How** to implement them correctly

## ADRs

1. [Redux Patterns](./001-redux-patterns.md) - Manual thunks, state structure, no logic in reducers
2. [Component Composition](./002-component-composition.md) - Packages vs components, thin pages
3. [Styling Rules](./003-styling-rules.md) - Styles object pattern, no inline styles
4. [API Integration](./004-api-integration.md) - API layer, thunks, error handling
5. [File Organization](./005-file-organization.md) - One function per file, barrel exports

## How to Use

When implementing a feature:
1. Search this folder for relevant patterns
2. Read the full ADR for context
3. Follow the ✅ examples exactly
4. Avoid the ❌ anti-patterns
```',
  '.cursor/architecture/README.md',
  'nextjs',
  2
),
(
  'Generate Redux Patterns ADR (Next.js)',
  'ard_nextjs_redux_patterns',
  'Generate .cursor/architecture/001-redux-patterns.md for Next.js',
  '# Task
Generate a .cursor/architecture/001-redux-patterns.md file documenting Redux patterns for Next.js.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Manual thunks (NEVER createAsyncThunk)
2. Thunk signature: AppThunk<Promise<200|400|500>>
3. State structure (dumps, current, builders, config)
4. No logic in reducers - business logic in thunks
5. No objects in builder slices
6. Include ✅/❌ examples for each pattern

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/001-redux-patterns.md',
  'nextjs',
  3
),
(
  'Generate Component Composition ADR (Next.js)',
  'ard_nextjs_component_composition',
  'Generate .cursor/architecture/002-component-composition.md for Next.js',
  '# Task
Generate a .cursor/architecture/002-component-composition.md file documenting component patterns for Next.js.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. App pages are thin wrappers (only import and render)
2. Features in src/packages/{feature}/
3. Shared UI in src/components/
4. Call thunks directly (no custom hook wrappers)
5. Package index.tsx is main component
6. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/002-component-composition.md',
  'nextjs',
  4
),
(
  'Generate Styling Rules ADR (Next.js)',
  'ard_nextjs_styling_rules',
  'Generate .cursor/architecture/003-styling-rules.md for Next.js',
  '# Task
Generate a .cursor/architecture/003-styling-rules.md file documenting styling patterns for Next.js.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Styles object pattern (NO inline styles, NO separate CSS files)
2. Template literal syntax with backticks
3. Styles defined AFTER component function
4. Responsive grouping (each breakpoint on separate line)
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/003-styling-rules.md',
  'nextjs',
  5
),
(
  'Generate API Integration ADR (Next.js)',
  'ard_nextjs_api_integration',
  'Generate .cursor/architecture/004-api-integration.md for Next.js',
  '# Task
Generate a .cursor/architecture/004-api-integration.md file documenting API patterns for Next.js.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. API functions in src/api/{domain}/
2. ApiResponse<T> type pattern
3. API called from thunks only (never directly from components)
4. Error handling and status codes
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/004-api-integration.md',
  'nextjs',
  6
),
(
  'Generate File Organization ADR (Next.js)',
  'ard_nextjs_file_organization',
  'Generate .cursor/architecture/005-file-organization.md for Next.js',
  '# Task
Generate a .cursor/architecture/005-file-organization.md file documenting file organization for Next.js.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. One function per file
2. Barrel exports (index.ts in every folder)
3. Named exports only (no default exports except pages)
4. Folder structure (app/, packages/, components/, utils/, store/, api/)
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/005-file-organization.md',
  'nextjs',
  7
),
(
  'Generate Constants & Utilities ADR (Next.js)',
  'ard_nextjs_constants_utilities',
  'Generate .cursor/architecture/006-constants-utilities.md for Next.js',
  '# Task
Generate a .cursor/architecture/006-constants-utilities.md file documenting constants and utilities for Next.js.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Extract utilities when used 2+ times
2. Constants in src/utils/{domain}/constants.ts
3. Pure utility functions (no hooks, no Redux)
4. Named constants (no magic numbers)
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  '.cursor/architecture/006-constants-utilities.md',
  'nextjs',
  8
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Count ARD tasks by stack type
SELECT 
  stack_type,
  COUNT(*) as task_count
FROM ard_tasks
GROUP BY stack_type
ORDER BY stack_type;

-- List all ARD tasks
SELECT 
  stack_type,
  name,
  output_path_template,
  sort_order
FROM ard_tasks
ORDER BY stack_type, sort_order;
