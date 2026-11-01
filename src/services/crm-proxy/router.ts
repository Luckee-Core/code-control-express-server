import { Router } from 'express';
import { proxyDeleteHandler } from './routes/proxy-delete-handler';
import { proxyGetHandler } from './routes/proxy-get-handler';

/**
 * CRM proxy — GET reads and DELETE customer to my-ops storage via main gateway.
 */
export const createCrmProxyRouter = (): Router => {
  const router = Router();
  router.delete('/customers/:customerId', proxyDeleteHandler);
  router.use((req, res, next) => {
    if (req.method === 'GET') {
      void proxyGetHandler(req, res);
      return;
    }
    next();
  });
  return router;
};
