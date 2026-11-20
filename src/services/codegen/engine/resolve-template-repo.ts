import { listRepoRoles } from '../../../data/repo-roles';
import { parseTemplateEnv } from '../../../utils/github/parse-template-env';
import type { CanonicalDataClient } from '../../canonical-data-client';
import type { GithubRepoRef } from '../../github';

/**
 * The template repo for a repo role: repo_roles.template_env_key names the env var that holds
 * `owner/repo` (e.g. express → GITHUB_TEMPLATE_EXPRESS). Null when the role has no template.
 */
export const resolveTemplateRepo = async (client: CanonicalDataClient, roleKey: string): Promise<GithubRepoRef | null> => {
  const roles = await listRepoRoles(client);
  const role = roles.find((item) => item.key === roleKey);
  if (!role?.template_env_key) return null;
  return parseTemplateEnv(process.env[role.template_env_key]);
};

/** Every role with a configured template repo: role key → owner/repo. */
export const listTemplateRepos = async (client: CanonicalDataClient): Promise<Array<{ role_key: string; ref: GithubRepoRef; full_name: string }>> => {
  const roles = await listRepoRoles(client);
  return roles.flatMap((role) => {
    const ref = role.template_env_key ? parseTemplateEnv(process.env[role.template_env_key]) : null;
    return ref ? [{ role_key: role.key, ref, full_name: `${ref.owner}/${ref.repo}` }] : [];
  });
};
