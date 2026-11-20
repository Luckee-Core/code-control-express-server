import { Router } from 'express';
import * as handlers from './routes';

/**
 * Agent runs router (mounted at /api/data/agent-runs): PR, convention and template agents.
 * Static paths are registered before `/:id`.
 */
export const createAgentRunsRouter = (): Router => {
  const router = Router();
  router.get('/', handlers.getAgentRunsHandler);
  router.get('/summary', handlers.getAgentRunSummaryHandler);
  router.get('/template-heads', handlers.getTemplateHeadsHandler);
  router.get('/:id', handlers.getAgentRunDetailHandler);
  router.patch('/:id', handlers.patchAgentRunDraftHandler);
  router.get('/:id/exchanges/:exchangeId', handlers.getAgentRunExchangeHandler);
  router.get('/:id/template-diff', handlers.getTemplateRunDiffHandler);
  router.get('/:id/template-file', handlers.getTemplateRunFileHandler);
  router.get('/:id/render-preview', handlers.getTemplateRenderPreviewHandler);
  router.post('/:id/confirm', handlers.postConfirmAgentRunHandler);
  router.post('/:id/approve', handlers.postApproveAgentRunHandler);
  router.post('/:id/reject', handlers.postRejectAgentRunHandler);
  router.post('/:id/revise', handlers.postReviseAgentRunHandler);
  router.post('/:id/dismiss', handlers.postDismissAgentRunHandler);
  router.post('/:id/retry', handlers.postRetryAgentRunHandler);
  return router;
};
