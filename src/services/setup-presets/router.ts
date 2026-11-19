import { Router } from 'express';
import { getSetupPresetsHandler } from './routes/get-setup-presets-handler';

/**
 * Creates the project types router (mounted at /api/data/setup-presets).
 */
export const createSetupPresetsRouter = (): Router => {
  const router = Router();
  router.get('/', getSetupPresetsHandler);
  return router;
};
