import { Router } from 'express';
import { getProjectReposHandler } from './routes/get-project-repos-handler';

/**
 * Creates the project-repos router (mounted at /api/data/project-repos).
 */
export const createProjectReposRouter = (): Router => {
  const router = Router();
  router.get('/', getProjectReposHandler);
  return router;
};
