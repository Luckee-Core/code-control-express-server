import { getProjectById } from '../../data/customer-projects';
import { getProjectReposByProjectId, insertProjectRepo } from '../../data/customer-project-repos';
import { parseTemplateEnv, resolveGithubOwner } from '../../utils/github';
import { createRepoFromTemplate } from '../github';
import type { CanonicalDataClient } from '../canonical-data-client';
import { slugifyRepoName } from './slugify-repo-name';
import type { CreateRepoFromTemplateResult, CreateRepoRequestBody, RepoTemplateConfig } from './types';

/**
 * Creates a GitHub repo from the configured template and links it to the project.
 * Idempotent by repo name: returns already_done when the project already has it.
 */
export const processCreateRepoFromTemplate = async (input: {
  client: CanonicalDataClient;
  projectId: string;
  config: RepoTemplateConfig;
  body: CreateRepoRequestBody;
}): Promise<CreateRepoFromTemplateResult> => {
  const { client, projectId, config, body } = input;

  const project = await getProjectById(client, projectId);
  if (!project) {
    return { kind: 'project_not_found' };
  }

  const template = parseTemplateEnv(process.env[config.templateEnvKey]);
  if (!template) {
    return {
      kind: 'template_missing',
      error: `${config.templateEnvKey} is not set (expected owner/repo)`,
    };
  }

  const nameOverride = body.name?.trim();
  const slugOverride = body.slug?.trim();
  const slug = slugOverride
    ? slugifyRepoName(slugOverride)
    : slugifyRepoName(project.name) || `project-${projectId.slice(0, 8)}`;
  const newRepoName = nameOverride
    ? slugifyRepoName(nameOverride)
    : config.readNamePattern().replace('{slug}', slug);

  const existing = await getProjectReposByProjectId(client, projectId);
  const already = existing.find((r) => r.name === newRepoName);
  if (already) {
    return { kind: 'already_done', repo_url: already.repo_url };
  }

  let newRepoOwner: string;
  try {
    newRepoOwner = resolveGithubOwner(body.owner?.trim(), template.owner);
  } catch (ownerError) {
    return {
      kind: 'invalid_request',
      error: ownerError instanceof Error ? ownerError.message : 'Invalid GitHub owner',
    };
  }

  console.log('🚀 Creating repo from template', { projectId, newRepoOwner, newRepoName });
  const result = await createRepoFromTemplate({
    templateOwner: template.owner,
    templateRepo: template.repo,
    newRepoOwner,
    newRepoName,
    description: project.description || undefined,
    private: true,
  });
  if (!result.success) {
    return { kind: 'invalid_request', error: result.error };
  }

  await insertProjectRepo(client, {
    customer_id: project.customer_id,
    project_id: projectId,
    repo_type: config.repoType,
    name: newRepoName,
    repo_url: result.repo_url,
    clone_url: result.clone_url,
  });

  return { kind: 'created', repo_url: result.repo_url, clone_url: result.clone_url };
};
