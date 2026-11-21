import { Router } from 'express';
import { getDataModelDeliveriesHandler } from './routes/get-data-model-deliveries-handler';
import { getDataModelDeliveryScreenshotHandler } from './routes/get-data-model-delivery-screenshot-handler';
import { getDataModelDeliveryPreviewHandler } from './routes/get-data-model-delivery-preview-handler';
import { postCreatePrAgentRunHandler } from './routes/post-create-pr-agent-run-handler';
import { postMergeDataModelDeliveryHandler } from './routes/post-merge-data-model-delivery-handler';
import { postDataModelDeliveryHandler } from './routes/post-data-model-delivery-handler';
import { postRefreshDataModelDeliveryHandler } from './routes/post-refresh-data-model-delivery-handler';

/**
 * Creates the data-model deliveries router (mounted at /api/data/data-model-deliveries).
 */
export const createDataModelDeliveriesRouter = (): Router => {
  const router = Router();
  router.get('/', getDataModelDeliveriesHandler);
  router.get('/preview', getDataModelDeliveryPreviewHandler);
  router.get('/screenshot', getDataModelDeliveryScreenshotHandler);
  router.post('/', postDataModelDeliveryHandler);
  router.post('/:id/refresh', postRefreshDataModelDeliveryHandler);
  router.post('/:id/merge', postMergeDataModelDeliveryHandler);
  router.post('/:id/pr-agent-runs', postCreatePrAgentRunHandler);
  return router;
};
