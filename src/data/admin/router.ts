/**
 * Code Control data API router.
 * Mounts customers, projects, project-repos, and project-setup under /api/data.
 */

import { Router } from 'express';
import { createCustomersRouter } from '../customers/router';
import { createProjectsRouter } from '../projects/router';
import { createProjectReposRouter } from '../project-repos/router';
import { createProjectSetupRouter } from '../project-setup/router';

/**
 * Creates the unified Code Control data router.
 */
export const createAdminRouter = (): Router => {
  const router = Router();

  router.use('/customers', createCustomersRouter());
  router.use('/projects/:id/project-setup', createProjectSetupRouter());
  router.use('/projects', createProjectsRouter());
  router.use('/project-repos', createProjectReposRouter());

  return router;
};
