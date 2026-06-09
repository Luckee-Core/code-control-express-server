/**
 * Resolve allowed GitHub orgs for repo creation from environment config.
 */

/**
 * Default owner for new repos: GITHUB_OWNER env or template owner.
 */
export const getDefaultGithubOwner = (templateOwner: string): string => {
  const envOwner = process.env.GITHUB_OWNER?.trim();
  return envOwner || templateOwner;
};

/**
 * Allowed owners for repo creation. When GITHUB_ALLOWED_OWNERS is unset, only the default owner is allowed.
 */
export const getAllowedGithubOwners = (templateOwner: string): string[] => {
  const defaultOwner = getDefaultGithubOwner(templateOwner);
  const allowedEnv = process.env.GITHUB_ALLOWED_OWNERS?.trim();

  if (!allowedEnv) {
    return [defaultOwner];
  }

  const owners = allowedEnv
    .split(',')
    .map((owner) => owner.trim())
    .filter(Boolean);

  return owners.length > 0 ? owners : [defaultOwner];
};

/**
 * Resolve the GitHub owner for a create-repo request, validating against the allowlist.
 *
 * @throws Error when requested owner is not in the allowed list
 */
export const resolveGithubOwner = (
  requestedOwner: string | undefined,
  templateOwner: string
): string => {
  const defaultOwner = getDefaultGithubOwner(templateOwner);
  const allowed = getAllowedGithubOwners(templateOwner);
  const allowedSet = new Set(allowed);
  const trimmed = requestedOwner?.trim();

  if (!trimmed) {
    return defaultOwner;
  }

  if (!allowedSet.has(trimmed)) {
    throw new Error(`Invalid GitHub owner "${trimmed}". Allowed: ${allowed.join(', ')}`);
  }

  return trimmed;
};

/**
 * GitHub org options for the project-setup UI.
 */
export const getGithubOrgOptions = (
  templateOwner: string
): { defaultOwner: string; options: string[] } => {
  const defaultOwner = getDefaultGithubOwner(templateOwner);
  const options = getAllowedGithubOwners(templateOwner);

  return { defaultOwner: defaultOwner, options };
};
