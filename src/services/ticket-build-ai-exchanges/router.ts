import { Router } from 'express';
import * as handlers from './routes';

/** Creates the ticket build AI exchanges router (mounted at /api/data/ticket-build-ai-exchanges). */
export const createTicketBuildAiExchangesRouter = (): Router => {
  const router = Router();
  router.get('/', handlers.getTicketBuildAiExchangesHandler);
  return router;
};
