import { Router } from 'express';
import { getSoftwareSystemReposHandler } from './routes/get-software-system-repos-handler';

/**
 * Creates the project-repos router (mounted at /api/data/software-system-repos).
 */
export const createSoftwareSystemReposRouter = (): Router => {
  const router = Router();
  router.get('/', getSoftwareSystemReposHandler);
  return router;
};
