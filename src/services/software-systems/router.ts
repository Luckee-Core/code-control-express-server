import { Router } from 'express';
import { deleteSoftwareSystemHandler } from './routes/delete-software-system-handler';
import { getSoftwareSystemAiCallsHandler } from './routes/get-software-system-ai-calls-handler';
import { getRecentSoftwareSystemOpensHandler } from './routes/get-recent-software-system-opens-handler';
import { getCustomerSoftwareSystemsHandler } from './routes/get-customer-software-systems-handler';
import { getSoftwareSystemByIdHandler } from './routes/get-software-system-by-id-handler';
import { getSoftwareSystemDispatcherPlanHandler } from './routes/get-software-system-dispatcher-plan-handler';
import { getSoftwareSystemsHandler } from './routes/get-software-systems-handler';
import { patchUpdateSoftwareSystemHandler } from './routes/patch-update-software-system-handler';
import { postCreateSoftwareSystemHandler } from './routes/post-create-software-system-handler';
import { postSoftwareSystemOpenHandler } from './routes/post-software-system-open-handler';

/**
 * Creates the software systems router (mounted at /api/data/software-systems).
 */
export const createSoftwareSystemsRouter = (): Router => {
  const router = Router();
  router.get('/', getSoftwareSystemsHandler);
  router.get('/recent-opens', getRecentSoftwareSystemOpensHandler);
  router.get('/customer/:customerId', getCustomerSoftwareSystemsHandler);
  router.get('/:id/ai-calls', getSoftwareSystemAiCallsHandler);
  router.get('/:id/dispatcher-plan', getSoftwareSystemDispatcherPlanHandler);
  router.get('/:id', getSoftwareSystemByIdHandler);
  router.post('/', postCreateSoftwareSystemHandler);
  router.post('/:id/opens', postSoftwareSystemOpenHandler);
  router.patch('/:id', patchUpdateSoftwareSystemHandler);
  router.delete('/:id', deleteSoftwareSystemHandler);
  return router;
};
