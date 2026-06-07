import { Router, Request, Response } from 'express';
import {
  getCursorGenerationRequestsByProject,
  getCursorGenerationRequestsByEntity,
} from './get-requests';
import {
  getCursorGenerationExchangesByRequest,
  getCursorGenerationExchangeById,
} from './get-exchanges';
import { getCursorGenerationResponseById } from './get-response';

export const createCursorGenerationRouter = (): Router => {
  const router = Router();

  /**
   * GET /api/data/cursor-generation/requests?project_id=xxx
   * Get requests by project ID
   */
  router.get('/requests', async (req: Request, res: Response) => {
    try {
      const { project_id, entity_id } = req.query;

      if (entity_id && typeof entity_id === 'string') {
        const requests = await getCursorGenerationRequestsByEntity(entity_id);
        return res.json(requests);
      }

      if (!project_id || typeof project_id !== 'string') {
        return res.status(400).json({ error: 'project_id or entity_id query parameter is required' });
      }

      const requests = await getCursorGenerationRequestsByProject(project_id);
      res.json(requests);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Error in GET cursor-generation/requests:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/data/cursor-generation/exchanges/:id
   * Get single exchange by ID
   */
  router.get('/exchanges/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ error: 'Exchange ID is required' });
      }
      const exchange = await getCursorGenerationExchangeById(id as string);
      if (!exchange) {
        return res.status(404).json({ error: 'Exchange not found' });
      }
      res.json(exchange);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Error in GET cursor-generation/exchanges/:id:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/data/cursor-generation/exchanges?request_id=xxx
   * Get exchanges by request ID
   */
  router.get('/exchanges', async (req: Request, res: Response) => {
    try {
      const { request_id } = req.query;
      if (!request_id || typeof request_id !== 'string') {
        return res.status(400).json({ error: 'request_id query parameter is required' });
      }
      const exchanges = await getCursorGenerationExchangesByRequest(request_id);
      res.json(exchanges);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Error in GET cursor-generation/exchanges:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/data/cursor-generation/responses/:id
   * Get response by ID
   */
  router.get('/responses/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ error: 'Response ID is required' });
      }

      const response = await getCursorGenerationResponseById(id as string);
      if (!response) {
        return res.status(404).json({ error: 'Response not found' });
      }

      res.json(response);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Error in GET cursor-generation/responses/:id:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
