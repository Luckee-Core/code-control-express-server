/**
 * Parses a GITHUB_TEMPLATE_* env value (`owner/repo`), or null when unset/invalid.
 */
export const parseTemplateEnv = (
  envValue: string | undefined
): { owner: string; repo: string } | null => {
  if (!envValue || !envValue.trim()) return null;
  const parts = envValue.trim().split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { owner: parts[0], repo: parts[1] };
};
