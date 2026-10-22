import type { RepoTemplateConfig } from './types';

export const EXPRESS_REPO_TEMPLATE: RepoTemplateConfig = {
  repoType: 'express',
  templateEnvKey: 'GITHUB_TEMPLATE_EXPRESS',
  readNamePattern: () => '{slug}-express-server',
};

export const PYTHON_REPO_TEMPLATE: RepoTemplateConfig = {
  repoType: 'python',
  templateEnvKey: 'GITHUB_TEMPLATE_PYTHON',
  readNamePattern: () => '{slug}-python-server',
};

export const WEB_REPO_TEMPLATE: RepoTemplateConfig = {
  repoType: 'nextjs',
  templateEnvKey: 'GITHUB_TEMPLATE_WEB',
  readNamePattern: () => process.env.PROJECT_SETUP_REPO_NAME_WEB?.trim() || '{slug}-web',
};

export const REACT_NATIVE_REPO_TEMPLATE: RepoTemplateConfig = {
  repoType: 'react-native',
  templateEnvKey: 'GITHUB_TEMPLATE_REACT_NATIVE',
  readNamePattern: () =>
    process.env.PROJECT_SETUP_REPO_NAME_REACT_NATIVE?.trim() || '{slug}-react-native',
};
