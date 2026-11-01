import { Router } from 'express';
import { getCompareHandler } from './routes/get-compare-handler';
import { postApplyHandler } from './routes/post-apply-handler';

/**
 * One-time customer sync with My Ops CRM.
 */
export const createCustomerOpsSyncRouter = (): Router => {
  const router = Router();
  router.get('/compare', getCompareHandler);
  router.post('/apply', postApplyHandler);
  return router;
};
