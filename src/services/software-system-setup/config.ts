import type { RepoTemplateConfig } from './types';

export const STORAGE_REPO_TEMPLATE: RepoTemplateConfig = {
  repoType: 'storage-express',
  role: 'storage',
  templateEnvKey: 'GITHUB_TEMPLATE_STORAGE_EXPRESS',
  readNamePattern: () => '{slug}-storage-express-server',
};

export const EXPRESS_REPO_TEMPLATE: RepoTemplateConfig = {
  repoType: 'express',
  role: 'express',
  templateEnvKey: 'GITHUB_TEMPLATE_EXPRESS',
  readNamePattern: () => '{slug}-express-server',
};

export const PYTHON_REPO_TEMPLATE: RepoTemplateConfig = {
  repoType: 'python',
  role: 'python',
  templateEnvKey: 'GITHUB_TEMPLATE_PYTHON',
  readNamePattern: () => '{slug}-python-server',
};

export const WEB_REPO_TEMPLATE: RepoTemplateConfig = {
  repoType: 'nextjs',
  role: 'web',
  templateEnvKey: 'GITHUB_TEMPLATE_WEB',
  readNamePattern: () => process.env.PROJECT_SETUP_REPO_NAME_WEB?.trim() || '{slug}-web',
};

export const REACT_NATIVE_REPO_TEMPLATE: RepoTemplateConfig = {
  repoType: 'react-native',
  role: 'mobile',
  templateEnvKey: 'GITHUB_TEMPLATE_REACT_NATIVE',
  readNamePattern: () =>
    process.env.PROJECT_SETUP_REPO_NAME_REACT_NATIVE?.trim() || '{slug}-react-native',
};

/** repo_roles keys a repo can be tagged with in the Repositories tab. */
export const ASSIGNABLE_REPO_ROLES = [
  'storage',
  'express',
  'web',
  'dispatcher',
  'dispatcher-web',
  'console',
  'mobile',
  'python',
] as const;
