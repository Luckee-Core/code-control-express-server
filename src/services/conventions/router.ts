import { Router } from 'express';
import { deleteConventionExampleHandler } from './routes/delete-convention-example-handler';
import { deleteConventionHandler } from './routes/delete-convention-handler';
import { deleteConventionSourceHandler } from './routes/delete-convention-source-handler';
import { getConventionDetailHandler } from './routes/get-convention-detail-handler';
import { getConventionsCatalogHandler } from './routes/get-conventions-catalog-handler';
import { getConventionsContextHandler } from './routes/get-conventions-context-handler';
import { getConventionsHandler } from './routes/get-conventions-handler';
import { patchUpdateConventionExampleHandler } from './routes/patch-update-convention-example-handler';
import { patchUpdateConventionHandler } from './routes/patch-update-convention-handler';
import { postCreateConventionExampleHandler } from './routes/post-create-convention-example-handler';
import { postCreateConventionHandler } from './routes/post-create-convention-handler';
import { postCreateConventionSourceHandler } from './routes/post-create-convention-source-handler';

/**
 * Creates the conventions router (mounted at /api/data/conventions).
 * Static paths are registered before `/:id`.
 */
export const createConventionsRouter = (): Router => {
  const router = Router();
  router.get('/', getConventionsHandler);
  router.get('/catalog', getConventionsCatalogHandler);
  router.get('/context', getConventionsContextHandler);
  router.patch('/examples/:exampleId', patchUpdateConventionExampleHandler);
  router.delete('/examples/:exampleId', deleteConventionExampleHandler);
  router.delete('/sources/:sourceId', deleteConventionSourceHandler);
  router.post('/', postCreateConventionHandler);
  router.get('/:id', getConventionDetailHandler);
  router.patch('/:id', patchUpdateConventionHandler);
  router.delete('/:id', deleteConventionHandler);
  router.post('/:id/examples', postCreateConventionExampleHandler);
  router.post('/:id/sources', postCreateConventionSourceHandler);
  return router;
};
