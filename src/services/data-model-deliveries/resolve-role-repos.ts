import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import type { CodegenRole } from '../codegen';

/** Template type an untagged repo must have to stand in for a role (roles added later need a tag). */
const FALLBACK_REPO_TYPE: Partial<Record<CodegenRole, SoftwareSystemRepo['repo_type']>> = {
  storage: 'storage-express',
  express: 'express',
  web: 'nextjs',
};

/**
 * The repo that plays a role: the one tagged with it, else the only untagged repo of the matching
 * template type (so a repo created before roles existed still works). Null when none or ambiguous.
 * dispatcher, dispatcher-web and gateway repos must be tagged.
 */
export const resolveRoleRepo = (repos: SoftwareSystemRepo[], role: CodegenRole): SoftwareSystemRepo | null => {
  const tagged = repos.find((repo) => repo.role === role);
  if (tagged) return tagged;
  const repoType = FALLBACK_REPO_TYPE[role];
  if (!repoType) return null;
  const candidates = repos.filter((repo) => !repo.role && repo.repo_type === repoType);
  return candidates.length === 1 ? candidates[0] : null;
};
