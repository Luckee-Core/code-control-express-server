/**
 * Data Entity Operations Router
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import {
  getDataEntityOperationsByProjectId,
  putDataEntityOperations,
} from './index';

export const createDataEntityOperationsRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.query.project_id as string;
      if (!projectId) {
        res.status(400).json({ success: false, error: 'project_id query param required' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const list = await getDataEntityOperationsByProjectId(supabase, projectId);
      res.status(200).json({ success: true, data: list, count: list.length });
    } catch (error) {
      console.error('Error in GET /api/data/data-entity-operations:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.put('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { entity_id, operation_keys } = req.body;
      if (!entity_id || !Array.isArray(operation_keys)) {
        res.status(400).json({
          success: false,
          error: 'entity_id and operation_keys (array) are required',
        });
        return;
      }
      const supabase = getManagedSupabaseClient();
      await putDataEntityOperations(supabase, { entity_id, operation_keys });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in PUT /api/data/data-entity-operations:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
