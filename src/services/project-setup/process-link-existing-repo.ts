import { getProjectById } from '../../data/customer-projects';
import { getProjectReposByProjectId, insertProjectRepo } from '../../data/customer-project-repos';
import type { RepoType } from '../../model/project-repo';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { ProjectSetupRepoResult } from './types';

/**
 * Links an existing GitHub repo to a project. Idempotent by repo name or URL.
 */
export const processLinkExistingRepo = async (input: {
  client: CanonicalDataClient;
  projectId: string;
  repoType: RepoType;
  repo: { name: string; repoUrl: string; cloneUrl: string };
}): Promise<ProjectSetupRepoResult> => {
  const { client, projectId, repoType, repo } = input;

  const project = await getProjectById(client, projectId);
  if (!project) {
    return { kind: 'project_not_found' };
  }

  const existing = await getProjectReposByProjectId(client, projectId);
  const already = existing.find((r) => r.name === repo.name || r.repo_url === repo.repoUrl);
  if (already) {
    return { kind: 'already_done', repo_url: already.repo_url };
  }

  await insertProjectRepo(client, {
    customer_id: project.customer_id,
    project_id: projectId,
    repo_type: repoType,
    name: repo.name,
    repo_url: repo.repoUrl,
    clone_url: repo.cloneUrl,
  });

  return { kind: 'created', repo_url: repo.repoUrl, clone_url: repo.cloneUrl };
};
