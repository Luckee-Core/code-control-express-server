import { Router } from 'express';
import { processAllQueuesHandler } from './process-all-queues';

/**
 * Cron routes for Code Control queue processing.
 */
export const createCronRouter = (): Router => {
  const router = Router();
  router.post('/process-all-queues', processAllQueuesHandler);
  return router;
};
