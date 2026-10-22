import { Router } from 'express';
import { getHealthHandler } from './routes/get-health-handler';

/**
 * Creates the health router (mounted at / and /api/health).
 */
export const createHealthRouter = (): Router => {
  const router = Router();
  router.get('/', getHealthHandler);
  return router;
};
