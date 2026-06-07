-- ============================================================================
-- Express build profile: update existing Express Server Build with express
-- conventions (from MentorAI ADRs). Safe to re-run.
-- ============================================================================

-- 1. Remove old convention links from Express Server Build
DELETE FROM build_profile_conventions
WHERE build_profile_id = '11111111-1111-1111-1111-111111111111';

-- 2. Remove existing express conventions (so we can re-insert fresh on re-run)
DELETE FROM build_conventions WHERE stack = 'express';

-- 3. Insert express conventions (based on MentorAI ADRs)
INSERT INTO build_conventions (name, stack, content, tags) VALUES
('Domain-based architecture', 'express', 'Organize code in src/domains/{domain}/ with router.ts, routes/, config.ts, types.ts. Each domain is self-contained.', ARRAY['express', 'domain']),
('Router factory pattern', 'express', 'Export createXRouter(): Router (factory function). Never export router directly. Enables DI and consistent naming.', ARRAY['express', 'router']),
('Thin routers', 'express', 'Routers: route definitions only. Delegate to handlers; no business logic in router file.', ARRAY['express', 'router']),
('Handlers in routes/', 'express', 'One handler per file in src/domains/{domain}/routes/. Import handlers; router only wires routes.', ARRAY['express', 'handler']),
('Handler structure', 'express', 'Handler: 1) get managed client 2) validate request 3) call business logic 4) try/catch errors 5) return response.', ARRAY['express', 'handler']),
('Business logic in functions', 'express', 'Handlers delegate to processX() functions. No business logic inline in handlers.', ARRAY['express', 'handler', 'logic']),
('CRUD in src/data/', 'express', 'Database CRUD in src/data/{entity}/. Never inline queries in domain logic.', ARRAY['express', 'data']),
('Managed service clients', 'express', 'Use getManagedSupabaseClient(), getManagedAnthropicClient(). Never createClient() in domain code.', ARRAY['express', 'services']),
('Check for null clients', 'express', 'Always check managed client before use. Return 500 if null.', ARRAY['express', 'services']),
('Try-catch in handlers', 'express', 'Error handling in handlers, not routers. Catch, log, return { success: false, error }.', ARRAY['express', 'handler', 'errors']),
('JSDoc on handlers', 'express', 'Add JSDoc to router factory, each handler, and business logic functions.', ARRAY['express', 'docs']),
('Emoji logging', 'express', 'Use consistent prefixes: 🚀 start, ✅ success, ❌ error, 📥 request, 📤 response, 🤖 AI, 💾 DB.', ARRAY['express', 'logging']),
('Status codes', 'express', '200 success, 400 client error, 500 server error.', ARRAY['express', 'api']),
('Edge functions call Railway only', 'express', 'Supabase edge functions: only call Railway endpoints. No CRUD or business logic in edge.', ARRAY['express', 'edge']),
('Service init at startup', 'express', 'Initialize managed clients once at server startup. Do not create per-request.', ARRAY['express', 'services']),
('One function per file in data/', 'express', 'Each CRUD function in src/data/{entity}/ gets own file with JSDoc.', ARRAY['express', 'data']),
('Extract utilities used 2+ times', 'express', 'Extract to src/utils/{domain}/ when used 2+ times. Pure functions, no side effects.', ARRAY['express', 'utils']),
('Use type not interface', 'express', 'Use `type` not `interface` for consistency.', ARRAY['express', 'typescript']);

-- 4. Update Express Server Build profile description
UPDATE build_profiles
SET description = 'Conventions for Express/Node.js backends: domain-based architecture, thin routers, managed services, handlers delegating to business logic. Based on MentorAI ADRs.',
  updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 5. Link Express Server Build to all express conventions
INSERT INTO build_profile_conventions (build_profile_id, build_convention_id, order_index, is_required)
SELECT
  '11111111-1111-1111-1111-111111111111',
  c.id,
  (row_number() OVER (ORDER BY c.name)::integer - 1),
  true
FROM build_conventions c
WHERE c.stack = 'express';
