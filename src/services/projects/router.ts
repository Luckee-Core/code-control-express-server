import { Router } from 'express';
import { deleteProjectHandler } from './routes/delete-project-handler';
import { getCustomerProjectsHandler } from './routes/get-customer-projects-handler';
import { getProjectByIdHandler } from './routes/get-project-by-id-handler';
import { getProjectsHandler } from './routes/get-projects-handler';
import { patchUpdateProjectHandler } from './routes/patch-update-project-handler';
import { postCreateProjectHandler } from './routes/post-create-project-handler';

/**
 * Creates the projects router (mounted at /api/data/projects).
 */
export const createProjectsRouter = (): Router => {
  const router = Router();
  router.get('/', getProjectsHandler);
  router.get('/customer/:customerId', getCustomerProjectsHandler);
  router.get('/:id', getProjectByIdHandler);
  router.post('/', postCreateProjectHandler);
  router.patch('/:id', patchUpdateProjectHandler);
  router.delete('/:id', deleteProjectHandler);
  return router;
};
