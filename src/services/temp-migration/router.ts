import { Router } from 'express';
import { requireTempMigrationEnabledMiddleware } from './require-temp-migration-enabled';
import { postImportFromLaptopHandler } from './routes/post-import-from-laptop-handler';

/**
 * Creates the temp migration admin router (manual operator use only; mounted at /api/admin).
 */
export const createTempMigrationRouter = (): Router => {
  const router = Router();
  router.use(requireTempMigrationEnabledMiddleware);
  router.post('/temp-import-from-laptop-storage', postImportFromLaptopHandler);
  return router;
};
