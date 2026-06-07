-- ============================================================================
-- Express-Specific ARD Tasks
-- Adds architecture documentation tasks specific to Express server projects
-- ============================================================================

-- Delete the generic tasks that don't apply to Express
DELETE FROM data_entity_generation_tasks 
WHERE task_type IN (
  'ard_redux_patterns',
  'ard_styling_rules'
);

-- Update the existing tasks to be more Express-focused
UPDATE data_entity_generation_tasks
SET 
  name = 'Generate File & Domain Organization ADR',
  description = 'Generate .cursor/architecture/001-file-and-domain-organization.md',
  output_path_template = '.cursor/architecture/001-file-and-domain-organization.md',
  prompt_template = '# Task
Generate a .cursor/architecture/001-file-and-domain-organization.md file for an Express server.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Document domain-based architecture (src/domains/{domain}/)
2. One function per file rule with examples
3. Index.ts barrel export patterns
4. Folder structure (domains, data, services, utils)
5. Include ✅/❌ examples for each pattern

# Output Format
Output ONLY the markdown content, no explanations.

# Example Structure
```markdown
# File & Domain Organization

## Domain-Based Architecture

✅ Correct:
```typescript
// src/domains/business-coach/router.ts
export const createBusinessCoachRouter = (): Router => {
  const router = Router();
  router.post(''/chat'', handlers.chatHandler);
  return router;
};
```

❌ Incorrect:
```typescript
// src/routes/business-coach.ts - wrong location
export const router = Router(); // not a factory
```

**Reasoning:** Domains are self-contained with router, routes/, config.ts, types.ts.

## One Function Per File

✅ Correct:
```typescript
// src/data/users/get-by-id.ts
export const getUserById = async (supabase: SupabaseClient, id: string) => {
  // ...
};
```

❌ Incorrect:
```typescript
// src/data/users.ts
export const getUserById = async () => { };
export const createUser = async () => { }; // multiple functions
```

## Related
- See [Router Factory Pattern](./002-router-factory-and-handler-pattern.md)
- See [Data Layer](./003-data-layer-crud-boundaries.md)
```',
  required_conventions_tags = ARRAY['express', 'domain', 'data', 'utils']
WHERE task_type = 'ard_file_organization';

UPDATE data_entity_generation_tasks
SET 
  name = 'Generate Router Factory & Handler Pattern ADR',
  description = 'Generate .cursor/architecture/002-router-factory-and-handler-pattern.md',
  output_path_template = '.cursor/architecture/002-router-factory-and-handler-pattern.md',
  prompt_template = '# Task
Generate a .cursor/architecture/002-router-factory-and-handler-pattern.md file for an Express server.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Router factory pattern (createXRouter(): Router)
2. Thin routers - only route definitions
3. Handlers in routes/ folder (one per file)
4. Handler structure (client, validate, logic, error handling)
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  required_conventions_tags = ARRAY['express', 'router', 'handler']
WHERE task_type = 'ard_api_conventions';

UPDATE data_entity_generation_tasks
SET 
  name = 'Generate Data Layer & CRUD Boundaries ADR',
  description = 'Generate .cursor/architecture/003-data-layer-crud-boundaries.md',
  output_path_template = '.cursor/architecture/003-data-layer-crud-boundaries.md',
  prompt_template = '# Task
Generate a .cursor/architecture/003-data-layer-crud-boundaries.md file for an Express server.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. CRUD operations in src/data/{entity}/
2. One function per file in data layer
3. Never inline queries in domain logic
4. Data layer gets SupabaseClient as first param
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.',
  required_conventions_tags = ARRAY['express', 'data']
WHERE task_type = 'ard_constants_utilities';

-- Add new Express-specific ADR tasks
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
  'Generate Managed Clients & Startup Init ADR',
  'ard_managed_clients',
  'Generate .cursor/architecture/004-managed-clients-and-startup-init.md',
  '# Task
Generate a .cursor/architecture/004-managed-clients-and-startup-init.md file for an Express server.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Use getManagedSupabaseClient(), getManagedAnthropicClient()
2. Never createClient() in domain code
3. Initialize once at server startup
4. Check for null before use
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.

# Example Structure
```markdown
# Managed Clients & Startup Init

## Managed Service Clients

✅ Correct:
```typescript
// Handler
const supabase = getManagedSupabaseClient();
if (!supabase) {
  return res.status(500).json({ success: false, error: ''Service unavailable'' });
}
```

❌ Incorrect:
```typescript
// Handler
const supabase = createClient(url, key); // ❌ Don''t create per-request
```

**Reasoning:** Managed clients are initialized once at startup for performance.

## Service Initialization

✅ Correct:
```typescript
// index.ts
await initializeSupabaseClient();
await initializeAnthropicClient();
app.listen(PORT);
```

## Related
- See [Handler Pattern](./002-router-factory-and-handler-pattern.md)
```',
  '.cursor/architecture/004-managed-clients-and-startup-init.md',
  ARRAY['express', 'services'],
  ARRAY[]::TEXT[],
  6
),
(
  'Generate Edge Functions & Railway Boundaries ADR',
  'ard_edge_boundaries',
  'Generate .cursor/architecture/005-edge-functions-railway-only.md',
  '# Task
Generate a .cursor/architecture/005-edge-functions-railway-only.md file for an Express server.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Supabase edge functions only call Railway endpoints
2. No CRUD or business logic in edge functions
3. Edge functions are thin proxies
4. All logic lives in Railway Express server
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.

# Example Structure
```markdown
# Edge Functions & Railway Boundaries

## Edge Functions Call Railway Only

✅ Correct:
```typescript
// Supabase edge function
Deno.serve(async (req: Request) => {
  const railwayUrl = Deno.env.get(''RAILWAY_API_URL'');
  const response = await fetch(`${railwayUrl}/api/process`, {
    method: ''POST'',
    headers: { ''Content-Type'': ''application/json'' }
  });
  return new Response(await response.text());
});
```

❌ Incorrect:
```typescript
// Supabase edge function
Deno.serve(async (req: Request) => {
  // ❌ Don''t do CRUD in edge
  const { data } = await supabase.from(''users'').select(''*'');
  // ❌ Don''t do business logic in edge
  for (const user of data) { /* ... */ }
});
```

**Reasoning:** Edge functions are thin proxies. All logic lives in Railway.

## Related
- See [Data Layer](./003-data-layer-crud-boundaries.md)
```',
  '.cursor/architecture/005-edge-functions-railway-only.md',
  ARRAY['express', 'edge'],
  ARRAY[]::TEXT[],
  7
),
(
  'Generate Logging & Error Response Standards ADR',
  'ard_logging_standards',
  'Generate .cursor/architecture/006-logging-and-error-response-standards.md',
  '# Task
Generate a .cursor/architecture/006-logging-and-error-response-standards.md file for an Express server.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions
{{conventions}}

# Requirements
1. Emoji logging conventions (🚀 start, ✅ success, ❌ error, etc.)
2. Status codes (200, 400, 500)
3. Error handling in handlers with try/catch
4. Consistent error response format
5. Include ✅/❌ examples

# Output Format
Output ONLY the markdown content, no explanations.

# Example Structure
```markdown
# Logging & Error Response Standards

## Emoji Logging

✅ Correct:
```typescript
console.log(''🚀 Starting process...'');
console.log(''✅ Success'');
console.error(''❌ Error:'', error);
console.log(''📥 Received request'');
console.log(''🤖 Calling AI...'');
console.log(''💾 Saving to database...'');
```

## Status Codes

✅ Correct:
```typescript
return res.status(200).json({ success: true, data });
return res.status(400).json({ success: false, error: ''Invalid input'' });
return res.status(500).json({ success: false, error: ''Server error'' });
```

## Error Handling

✅ Correct:
```typescript
// Handler
try {
  const result = await processData(data);
  res.status(200).json({ success: true, data: result });
} catch (error: any) {
  console.error(''❌ Error:'', error);
  res.status(500).json({ success: false, error: error.message });
}
```

❌ Incorrect:
```typescript
// Router - no error handling
router.post(''/process'', async (req, res) => {
  const result = await processData(req.body); // ❌ No try/catch
  res.json(result);
});
```

**Reasoning:** Consistent error handling and logging makes debugging easier.

## Related
- See [Handler Pattern](./002-router-factory-and-handler-pattern.md)
```',
  '.cursor/architecture/006-logging-and-error-response-standards.md',
  ARRAY['express', 'logging', 'errors', 'api'],
  ARRAY[]::TEXT[],
  8
);

-- Update the AGENTS.md prompt to reference the correct Express ADRs
UPDATE data_entity_generation_tasks
SET prompt_template = '# Task
Generate a .cursor/rules/AGENTS.md file for an Express server repository.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Conventions to Follow
{{conventions}}

# Requirements
1. Use NEVER/ALWAYS/MUST directive language
2. Reference architecture docs in .cursor/architecture/
3. Include quick reference section linking to Express-specific ADRs
4. Keep it concise (under 100 lines)
5. Group rules by domain (Domain Architecture, Handlers, Data Layer, Services, Logging)

# Output Format
Output ONLY the markdown content for AGENTS.md, no explanations or meta-commentary.

# Example Structure
```markdown
# Express Server Rules

BEFORE implementing ANY feature, you MUST:
1. Read `.cursor/architecture/README.md`
2. Search `.cursor/architecture/` for relevant patterns
3. Follow examples EXACTLY as shown

## Non-Negotiable Rules
1. Domains: Organize in src/domains/{domain}/ with router.ts, routes/, config.ts
2. Routers: Factory pattern (createXRouter(): Router). Thin - only route definitions.
3. Handlers: One per file in routes/. Delegate to business logic functions.
4. Data: CRUD in src/data/{entity}/. Never inline queries in domain logic.
5. Clients: Use getManagedSupabaseClient(). Never createClient() in handlers.
6. Edge: Supabase edge functions only call Railway. No CRUD in edge.
7. Logging: Use emojis (🚀 start, ✅ success, ❌ error, 📥 request, 🤖 AI, 💾 DB).

## Quick Reference (Architecture + ADRs)
- Architecture entrypoint → `.cursor/architecture/README.md`
- File & domain organization → `.cursor/architecture/001-file-and-domain-organization.md`
- Router factory & handlers → `.cursor/architecture/002-router-factory-and-handler-pattern.md`
- Data layer & CRUD → `.cursor/architecture/003-data-layer-crud-boundaries.md`
- Managed clients & startup → `.cursor/architecture/004-managed-clients-and-startup-init.md`
- Edge functions & Railway → `.cursor/architecture/005-edge-functions-railway-only.md`
- Logging & error standards → `.cursor/architecture/006-logging-and-error-response-standards.md`
```'
WHERE task_type = 'ard_agents_md';

-- Update Architecture README to list Express ADRs
UPDATE data_entity_generation_tasks
SET prompt_template = '# Task
Generate a .cursor/architecture/README.md file for an Express server that serves as an index for all architecture decision records.

# Repository Info
- Name: {{repoName}}
- Stack: {{stackType}}

# Requirements
1. List all Express-specific ADR files with brief descriptions
2. Explain the purpose of architecture documentation
3. Provide navigation links to each ADR
4. Keep it concise

# Output Format
Output ONLY the markdown content for README.md, no explanations.

# Example Structure
```markdown
# Architecture Documentation

This folder contains Architecture Decision Records (ADRs) that document our Express server coding conventions and patterns.

## Why ADRs?

ADRs help maintain consistency across the codebase by documenting:
- **What** patterns we use
- **Why** we chose them
- **How** to implement them correctly

## ADRs

1. [File & Domain Organization](./001-file-and-domain-organization.md) - Domain-based architecture, one function per file
2. [Router Factory & Handler Pattern](./002-router-factory-and-handler-pattern.md) - Thin routers, handlers in routes/
3. [Data Layer & CRUD Boundaries](./003-data-layer-crud-boundaries.md) - CRUD in src/data/, never inline queries
4. [Managed Clients & Startup Init](./004-managed-clients-and-startup-init.md) - Service initialization and managed clients
5. [Edge Functions & Railway Boundaries](./005-edge-functions-railway-only.md) - Edge functions only call Railway
6. [Logging & Error Response Standards](./006-logging-and-error-response-standards.md) - Emoji logging, status codes, error handling

## How to Use

When implementing a feature:
1. Search this folder for relevant patterns
2. Read the full ADR for context
3. Follow the ✅ examples exactly
4. Avoid the ❌ anti-patterns
```'
WHERE task_type = 'ard_architecture_readme';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify Express ARD tasks
SELECT 
  'Express ARD Tasks:' as status,
  COUNT(*) as count 
FROM data_entity_generation_tasks 
WHERE task_type LIKE 'ard_%';

-- List all ARD tasks
SELECT 
  sort_order,
  name,
  output_path_template,
  required_conventions_tags
FROM data_entity_generation_tasks 
WHERE task_type LIKE 'ard_%'
ORDER BY sort_order;
