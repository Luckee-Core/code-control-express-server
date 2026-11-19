/** Model-config key for the plan step. */
export const TICKET_BUILD_PROMPT_TYPE = 'ticket_build_plan';

/** A build stuck in `planning` this long with no live job in this process is marked failed. */
export const STALE_PLANNING_MS = 15 * 60 * 1000;

export const MAX_FEEDBACK_CHARS = 4000;
export const MAX_CONTRACT_CHARS = 30000;
export const MAX_REPO_PLAN_CHARS = 20000;

/** Per-repo planning context caps. */
export const MAX_TREE_PATHS = 800;
export const MAX_DOC_CHARS = 12000;
export const MAX_CONVENTIONS_CHARS = 30000;

/** Docs read from each repo for planning (missing ones are skipped). */
export const KEY_DOC_PATHS = ['CLAUDE.md', '.cursor/rules/AGENTS.md', '.cursor/architecture/README.md'];

/** Paths left out of the planning file tree. */
export const TREE_SKIP_PATTERN =
  /(^|\/)(node_modules|dist|build|\.next|coverage|\.git)\/|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|tsconfig\.tsbuildinfo)$|\.(png|jpe?g|gif|svg|ico|webp|woff2?|ttf|mp4|pdf)$/i;

/** Build order of roles (storage first, so the contract's tables come first). */
export const ROLE_ORDER = ['storage', 'express', 'python', 'web', 'console', 'mobile', 'dispatcher', 'dispatcher-web'];

/** Roles that are part of the system but rarely change for a feature ticket (excluded by default). */
export const DEFAULT_EXCLUDED_ROLES = ['dispatcher', 'dispatcher-web'];
