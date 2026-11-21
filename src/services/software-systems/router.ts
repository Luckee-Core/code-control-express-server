import { Router } from 'express';
import { deleteSoftwareSystemHandler } from './routes/delete-software-system-handler';
import { getSoftwareSystemAiCallsHandler } from './routes/get-software-system-ai-calls-handler';
import { getCustomerSoftwareSystemsHandler } from './routes/get-customer-software-systems-handler';
import { getSoftwareSystemByIdHandler } from './routes/get-software-system-by-id-handler';
import { getSoftwareSystemsHandler } from './routes/get-software-systems-handler';
import { patchUpdateSoftwareSystemHandler } from './routes/patch-update-software-system-handler';
import { postCreateSoftwareSystemHandler } from './routes/post-create-software-system-handler';

/**
 * Creates the software systems router (mounted at /api/data/software-systems).
 */
export const createSoftwareSystemsRouter = (): Router => {
  const router = Router();
  router.get('/', getSoftwareSystemsHandler);
  router.get('/customer/:customerId', getCustomerSoftwareSystemsHandler);
  router.get('/:id/ai-calls', getSoftwareSystemAiCallsHandler);
  router.get('/:id', getSoftwareSystemByIdHandler);
  router.post('/', postCreateSoftwareSystemHandler);
  router.patch('/:id', patchUpdateSoftwareSystemHandler);
  router.delete('/:id', deleteSoftwareSystemHandler);
  return router;
};
