import { listRepoRoles } from '../../../data/repo-roles';
import { readTemplateEnv } from '../../../utils/github/read-template-env';
import type { CanonicalDataClient } from '../../canonical-data-client';
import type { GithubRepoRef } from '../../github';

/**
 * The template repo for a repo role: repo_roles.template_env_key names the env var that holds
 * `owner/repo` (e.g. express → GITHUB_TEMPLATE_EXPRESS; dispatcher roles fall back to the express and web templates). Null when the role has no template.
 */
export const resolveTemplateRepo = async (client: CanonicalDataClient, roleKey: string): Promise<GithubRepoRef | null> => {
  const roles = await listRepoRoles(client);
  const role = roles.find((item) => item.key === roleKey);
  if (!role?.template_env_key) return null;
  return readTemplateEnv(role.template_env_key);
};

/** Every role with a configured template repo: role key → owner/repo. */
export const listTemplateRepos = async (client: CanonicalDataClient): Promise<Array<{ role_key: string; ref: GithubRepoRef; full_name: string }>> => {
  const roles = await listRepoRoles(client);
  return roles.flatMap((role) => {
    const ref = role.template_env_key ? readTemplateEnv(role.template_env_key) : null;
    return ref ? [{ role_key: role.key, ref, full_name: `${ref.owner}/${ref.repo}` }] : [];
  });
};
