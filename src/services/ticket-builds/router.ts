import { Router } from 'express';
import * as handlers from './routes';

/**
 * Creates the ticket builds router (mounted at /api/data/ticket-builds): list, create (plan in the
 * background), get (polling: syncs agents and PRs), edit contract, revise, start agents.
 */
export const createTicketBuildsRouter = (): Router => {
  const router = Router();
  router.get('/', handlers.getTicketBuildsHandler);
  router.post('/', handlers.postCreateTicketBuildHandler);
  router.get('/:id', handlers.getTicketBuildHandler);
  router.patch('/:id', handlers.patchTicketBuildHandler);
  router.post('/:id/revise', handlers.postReviseTicketBuildHandler);
  router.post('/:id/start', handlers.postStartTicketBuildHandler);
  return router;
};
