import { parseTemplateEnv } from './parse-template-env';

/**
 * Dispatcher repos start from the plain express and web templates unless their own variable is
 * set, so the Standard type needs no dispatcher-specific template repos.
 */
const FALLBACK_TEMPLATE_ENV_KEY: Record<string, string> = {
  GITHUB_TEMPLATE_DISPATCHER_EXPRESS: 'GITHUB_TEMPLATE_EXPRESS',
  GITHUB_TEMPLATE_DISPATCHER_WEB: 'GITHUB_TEMPLATE_WEB',
};

/**
 * The `owner/repo` template named by a repo role's template env key, falling back to the base
 * template for dispatcher roles. Null when neither variable is set.
 */
export const readTemplateEnv = (envKey: string): { owner: string; repo: string } | null => {
  const own = parseTemplateEnv(process.env[envKey]);
  if (own) return own;
  const fallbackKey = FALLBACK_TEMPLATE_ENV_KEY[envKey];
  return fallbackKey ? parseTemplateEnv(process.env[fallbackKey]) : null;
};

/** Env var names to mention when a role's template is missing. */
export const describeTemplateEnvKey = (envKey: string): string => {
  const fallbackKey = FALLBACK_TEMPLATE_ENV_KEY[envKey];
  return fallbackKey ? `${envKey} or ${fallbackKey}` : envKey;
};
