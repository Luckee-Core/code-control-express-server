import { Router } from 'express';
import { postImportToLocalHandler } from './routes/post-import-to-local-handler';

/**
 * Studio-local seed import (remote storage → on-device Postgres via local storage Express).
 */
export const createStudioSeedRouter = (): Router => {
  const router = Router();
  router.post('/import-to-local', postImportToLocalHandler);
  return router;
};
