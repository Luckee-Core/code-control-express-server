/**
 * Step Task Categories Router
 * Express router factory for step-task-category mapping operations
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getAllStepTaskCategories } from './get-all';
import { assignCategory } from './assign-category';
import { unassignCategory } from './unassign-category';

export const createStepTaskCategoriesRouter = (): Router => {
  const router = Router();

  // GET /api/data/step-task-categories
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const data = await getAllStepTaskCategories(supabase);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in GET /api/data/step-task-categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch step task categories',
      });
    }
  });

  // POST /api/data/step-task-categories
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const data = await assignCategory(supabase, req.body);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in POST /api/data/step-task-categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assign category',
      });
    }
  });

  // DELETE /api/data/step-task-categories/:buildStepId/:taskCategoryId
  router.delete('/:buildStepId/:taskCategoryId', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const buildStepId = Array.isArray(req.params.buildStepId) ? req.params.buildStepId[0] : req.params.buildStepId;
      const taskCategoryId = Array.isArray(req.params.taskCategoryId) ? req.params.taskCategoryId[0] : req.params.taskCategoryId;
      
      await unassignCategory(supabase, buildStepId, taskCategoryId);
      
      res.status(200).json({
        success: true,
        data: null,
      });
    } catch (error: any) {
      console.error('❌ Error in DELETE /api/data/step-task-categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to unassign category',
      });
    }
  });

  return router;
};
