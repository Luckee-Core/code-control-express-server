import { Router } from 'express';
import { getCustomersHandler } from './routes/get-customers-handler';
import { getCustomerByIdHandler } from './routes/get-customer-by-id-handler';
import { postCreateCustomerHandler } from './routes/post-create-customer-handler';

/**
 * Creates the customers router (mounted at /api/data/customers).
 */
export const createCustomersRouter = (): Router => {
  const router = Router();
  router.get('/', getCustomersHandler);
  router.post('/', postCreateCustomerHandler);
  router.get('/:id', getCustomerByIdHandler);
  return router;
};
