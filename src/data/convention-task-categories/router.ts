/**
 * Convention Task Categories Router
 * Express router factory for convention-task-category mapping operations
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getAllConventionTaskCategories } from './get-all';
import { assignConvention } from './assign-convention';
import { unassignConvention } from './unassign-convention';

export const createConventionTaskCategoriesRouter = (): Router => {
  const router = Router();

  // GET /api/data/convention-task-categories
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const data = await getAllConventionTaskCategories(supabase);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in GET /api/data/convention-task-categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch convention task categories',
      });
    }
  });

  // POST /api/data/convention-task-categories
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const data = await assignConvention(supabase, req.body);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in POST /api/data/convention-task-categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assign convention',
      });
    }
  });

  // DELETE /api/data/convention-task-categories/:conventionId/:taskCategoryId
  router.delete('/:conventionId/:taskCategoryId', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const conventionId = Array.isArray(req.params.conventionId) ? req.params.conventionId[0] : req.params.conventionId;
      const taskCategoryId = Array.isArray(req.params.taskCategoryId) ? req.params.taskCategoryId[0] : req.params.taskCategoryId;
      
      await unassignConvention(supabase, conventionId, taskCategoryId);
      
      res.status(200).json({
        success: true,
        data: null,
      });
    } catch (error: any) {
      console.error('❌ Error in DELETE /api/data/convention-task-categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to unassign convention',
      });
    }
  });

  return router;
};
