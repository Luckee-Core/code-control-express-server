import type { RepoType } from '../../model/project-repo';

export type RepoTemplateConfig = {
  repoType: RepoType;
  templateEnvKey: string;
  readNamePattern: () => string;
};

export type CreateRepoRequestBody = {
  slug?: string;
  name?: string;
  owner?: string;
};

export type ProjectSetupRepoResult =
  | { kind: 'project_not_found' }
  | { kind: 'already_done'; repo_url: string }
  | { kind: 'created'; repo_url: string; clone_url: string | null };

export type CreateRepoFromTemplateResult =
  | ProjectSetupRepoResult
  | { kind: 'template_missing'; error: string }
  | { kind: 'invalid_request'; error: string };
