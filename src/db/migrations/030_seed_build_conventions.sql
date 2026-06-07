-- Add tags to build_conventions and seed one row per guideline (tags for filtering)
-- Run after 029_control_panel_steps_conventions_examples.sql

ALTER TABLE build_conventions
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN build_conventions.tags IS 'Tags for filtering; overlap with step tags when generating context';

CREATE INDEX IF NOT EXISTS idx_build_conventions_tags ON build_conventions USING GIN(tags);

-- Replace previous seed (if any) with granular rows
DELETE FROM build_conventions;

INSERT INTO build_conventions (name, stack, content, tags) VALUES
-- Global
('Utilities are reusable', 'global', 'Extract functions to `src/utils/{domain}/` when used 2+ times.', ARRAY['global']),
('Packages organize features', 'global', 'Each feature lives in `src/packages/{feature}/`.', ARRAY['global']),
('Components call thunks directly', 'global', 'No custom hooks that just wrap thunks.', ARRAY['global']),
('Constants are named', 'global', 'No magic numbers; extract to domain constants.', ARRAY['global']),
('Styles stay inline', 'global', 'Keep styles in component file below the component.', ARRAY['global']),
('Use type not interface', 'global', 'Use `type` not `interface` for consistency.', ARRAY['global', 'nextjs', 'redux']),
('File organization', 'global', 'src/app/ = thin pages; src/packages/{feature}/ = features; src/components/ = shared UI; src/utils/{domain}/ = utilities; src/store/ = Redux; src/api/ = API.', ARRAY['global']),
-- Utils (ADR 001)
('One function per file', 'utils', 'Each utility in `src/utils/{domain}/functionName.ts` with JSDoc (purpose, params, return, @example).', ARRAY['utils']),
('Barrel exports', 'utils', 'Each domain folder has `index.ts`: `export * from ''./formatDuration''` etc.', ARRAY['utils']),
('Keep utilities pure', 'utils', 'No React hooks, no Redux; same input → same output; framework-agnostic.', ARRAY['utils']),
('When to extract a utility', 'utils', 'Extract when: used in 2+ places; data transformation; no side effects; single clear purpose (or 3+ lines).', ARRAY['utils']),
('When not to extract', 'utils', 'Don''t extract when: highly specific to one component; uses hooks/state; 1–2 lines only; has side effects (API, mutations).', ARRAY['utils']),
('Utils domain: date-time', 'utils', 'formatDuration, formatTimestamp, parseISODate.', ARRAY['utils']),
('Utils domain: video', 'utils', 'constants.ts, getBlobDuration, video helpers.', ARRAY['utils']),
('Utils domain: text', 'utils', 'truncate, slugify, capitalize, stripHTML.', ARRAY['utils']),
('Utils domain: url', 'utils', 'buildShareUrl, copyToClipboard, parseQueryParams.', ARRAY['utils']),
('Utils domain: number', 'utils', 'formatBytes, formatPercentage, clamp.', ARRAY['utils']),
-- Next.js / Component (ADR 002)
('App pages are thin wrappers', 'nextjs', 'Only import from packages and render; minimal logic.', ARRAY['nextjs']),
('Packages own features', 'nextjs', 'Each package under `src/packages/{feature}/` is a complete feature.', ARRAY['nextjs']),
('Call thunks directly', 'nextjs', 'No custom hooks that just wrap thunks. Exception: complex reusable logic, third-party integrations, browser API wrappers.', ARRAY['nextjs']),
('Use type not interface for props', 'nextjs', 'Use `type` not `interface` for component props.', ARRAY['nextjs']),
('Styles inline in component file', 'nextjs', 'Styles object in same file, below the component; no separate .css or .module.css.', ARRAY['nextjs']),
('Package index is main component', 'nextjs', '`index.tsx` in a package is the main component, not a barrel export. Barrel exports only in non-UI folders (utils, store, api).', ARRAY['nextjs']),
('App page structure', 'nextjs', 'app/{route}/page.tsx → imports and renders from packages/{feature}. packages/{feature}/index.tsx → main composer.', ARRAY['nextjs']),
('Component red flags', 'nextjs', 'Custom hook that only wraps a thunk; styles in separate files; barrel index.ts in UI folders; app page doing business logic; prop drilling > 2 levels.', ARRAY['nextjs']),
-- Constants (ADR 003)
('Extract magic numbers', 'constants', 'Use named constants from `src/utils/{domain}/constants.ts`.', ARRAY['constants']),
('Constants location', 'constants', 'Domain-based: e.g. utils/video/constants.ts, utils/date-time/constants.ts.', ARRAY['constants']),
('Group related constants', 'constants', 'Use objects: VIDEO_CONSTRAINTS = { maxDuration, bitrate, resolution } as const.', ARRAY['constants']),
('Use as const', 'constants', 'Use TypeScript `as const` for immutability and type inference.', ARRAY['constants']),
('Document constants', 'constants', 'JSDoc with units and reasoning for each constant.', ARRAY['constants']),
('Constants vs config', 'constants', 'Constants = same in all envs (limits, formats). Config = env-specific (API URL, feature flags) in Redux config or env.', ARRAY['constants']),
('Constants domains', 'constants', 'video, date-time, file, network, ui (e.g. MAX_RECORDING_DURATION, BYTES_PER_MB, API_TIMEOUT, MOBILE_BREAKPOINT).', ARRAY['constants']),
('Constants red flags', 'constants', 'Numbers without variable names; same number in multiple files; strings repeated; comments explaining what a number means.', ARRAY['constants']),
-- Redux (ADR 004)
('Store structure: dumps', 'redux', 'dumps/ = normalized collections (by ID).', ARRAY['redux']),
('Store structure: current', 'redux', 'current/ = single entity being edited (e.g. currentVideo, currentUser).', ARRAY['redux']),
('Store structure: builders', 'redux', 'builders/ = UI state (modals, loading, flags).', ARRAY['redux']),
('Store structure: config', 'redux', 'config/ = app configuration (environment, auth).', ARRAY['redux']),
('Store structure: thunks', 'redux', 'thunks/ = async actions by domain; return status codes (200, 400, 500).', ARRAY['redux']),
('Typed hooks', 'redux', 'Use useAppDispatch and useAppSelector from store/hooks.', ARRAY['redux']),
('Manual thunks', 'redux', 'Use AppThunk<R>; never createAsyncThunk.', ARRAY['redux']),
('Thunk signature', 'redux', '(): AppThunk<Promise<200|400|500>> => async (dispatch, getState) => { ... }.', ARRAY['redux']),
('No logic in reducers', 'redux', 'Reducers only update state; business logic and side effects in thunks.', ARRAY['redux']),
('No objects in builder slices', 'redux', 'Store IDs/primitives in builders; full object in current slices to avoid reference issues.', ARRAY['redux']),
('When to use thunks', 'redux', 'API calls, calculations, reading state before updating, multiple dispatches.', ARRAY['redux']),
('When to use direct actions', 'redux', 'Simple state updates with provided values, booleans, single strings/numbers.', ARRAY['redux']),
-- API (ADR 005)
('ApiResponse type', 'api', 'Frontend API returns ApiResponse<T>: { success: boolean; data?: T; error?: string }.', ARRAY['api']),
('apiBaseUrl first param', 'api', 'API functions take apiBaseUrl (string) as first parameter.', ARRAY['api']),
('One function per file in api', 'api', 'One function per file in src/api/{domain}/ with JSDoc.', ARRAY['api']),
('API called from thunks only', 'api', 'Never call API functions directly from components; call from thunks only.', ARRAY['api']),
('API error handling', 'api', 'try/catch; log with clear message; return { success: false, error }.', ARRAY['api']),
('Backend by domain', 'api', 'Organize backend by domain; routers and handlers per domain.', ARRAY['api']),
('Thin routers', 'api', 'Routers: route definitions only; logic in handlers or service functions.', ARRAY['api']),
('Status codes', 'api', '200 success, 400 client error, 500 server error.', ARRAY['api']),
('Emoji logging', 'api', 'Use consistent prefixes for logs (e.g. ❌ for errors).', ARRAY['api']);
