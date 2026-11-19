import { Router } from 'express';
import * as handlers from './routes';

/** Creates the ticket build repos router (mounted at /api/data/ticket-build-repos). */
export const createTicketBuildReposRouter = (): Router => {
  const router = Router();
  router.get('/', handlers.getTicketBuildReposHandler);
  router.patch('/:id', handlers.patchTicketBuildRepoHandler);
  return router;
};
