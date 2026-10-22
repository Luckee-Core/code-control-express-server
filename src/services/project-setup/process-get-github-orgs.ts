import { getGithubOrgOptions, parseTemplateEnv } from '../../utils/github';

/**
 * Returns GitHub owner options for new repos, based on the express template owner.
 * Throws when GITHUB_TEMPLATE_EXPRESS is not configured.
 */
export const processGetGithubOrgs = (): ReturnType<typeof getGithubOrgOptions> => {
  const template = parseTemplateEnv(process.env.GITHUB_TEMPLATE_EXPRESS);
  if (!template) {
    throw new Error('GITHUB_TEMPLATE_EXPRESS is not set (expected owner/repo)');
  }
  return getGithubOrgOptions(template.owner);
};
