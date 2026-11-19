import { Router } from 'express';
import {
  EXPRESS_REPO_TEMPLATE,
  PYTHON_REPO_TEMPLATE,
  REACT_NATIVE_REPO_TEMPLATE,
  STORAGE_REPO_TEMPLATE,
  WEB_REPO_TEMPLATE,
} from './config';
import { getGithubOrgsHandler } from './routes/get-github-orgs-handler';
import { getSoftwareSystemSetupReposHandler } from './routes/get-software-system-setup-repos-handler';
import { createPostCreateRepoHandler } from './routes/post-create-repo-handler';
import { patchRepoRoleHandler } from './routes/patch-repo-role-handler';
import { postApplySetupPresetHandler } from './routes/post-apply-setup-preset-handler';
import { postLinkExistingRepoHandler } from './routes/post-link-existing-repo-handler';

/**
 * Creates the project setup router (mounted at /api/data/software-systems/:id/software-system-setup).
 */
export const createSoftwareSystemSetupRouter = (): Router => {
  const router = Router({ mergeParams: true });
  router.get('/github-orgs', getGithubOrgsHandler);
  router.get('/repos', getSoftwareSystemSetupReposHandler);
  router.post('/create-storage-repo', createPostCreateRepoHandler(STORAGE_REPO_TEMPLATE));
  router.post('/create-express-repo', createPostCreateRepoHandler(EXPRESS_REPO_TEMPLATE));
  router.post('/create-python-repo', createPostCreateRepoHandler(PYTHON_REPO_TEMPLATE));
  router.post('/create-web-repo', createPostCreateRepoHandler(WEB_REPO_TEMPLATE));
  router.post('/create-react-native-repo', createPostCreateRepoHandler(REACT_NATIVE_REPO_TEMPLATE));
  router.post('/link-existing-repo', postLinkExistingRepoHandler);
  router.patch('/repos/:repoId/role', patchRepoRoleHandler);
  router.post('/apply-preset', postApplySetupPresetHandler);
  return router;
};
