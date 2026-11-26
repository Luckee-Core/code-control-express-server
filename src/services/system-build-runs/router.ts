import { Router } from 'express';
import * as handlers from './routes';

/**
 * Creates the build runs router (mounted at /api/data/system-build-runs): list, start "Build all"
 * (background), get (polling), continue and cancel.
 */
export const createSystemBuildRunsRouter = (): Router => {
  const router = Router();
  router.get('/', handlers.getSystemBuildRunsHandler);
  router.post('/', handlers.postCreateSystemBuildRunHandler);
  router.get('/:id', handlers.getSystemBuildRunHandler);
  router.post('/:id/continue', handlers.postContinueSystemBuildRunHandler);
  router.post('/:id/cancel', handlers.postCancelSystemBuildRunHandler);
  return router;
};
