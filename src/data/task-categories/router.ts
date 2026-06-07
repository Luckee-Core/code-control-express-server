/**
 * Task Categories Router
 * Express router factory for task categories CRUD operations
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getAllTaskCategories } from './get-all';
import { getTaskCategoryById } from './get-by-id';
import { createTaskCategory } from './create';
import { updateTaskCategory } from './update';
import { deleteTaskCategory } from './delete';

export const createTaskCategoriesRouter = (): Router => {
  const router = Router();

  // GET /api/data/task-categories
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const data = await getAllTaskCategories(supabase);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in GET /api/data/task-categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch task categories',
      });
    }
  });

  // GET /api/data/task-categories/:id
  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await getTaskCategoryById(supabase, id);
      
      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Task category not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in GET /api/data/task-categories/:id:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch task category',
      });
    }
  });

  // POST /api/data/task-categories
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const data = await createTaskCategory(supabase, req.body);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in POST /api/data/task-categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create task category',
      });
    }
  });

  // PATCH /api/data/task-categories/:id
  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await updateTaskCategory(supabase, id, req.body);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in PATCH /api/data/task-categories/:id:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update task category',
      });
    }
  });

  // DELETE /api/data/task-categories/:id
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await deleteTaskCategory(supabase, id);
      
      res.status(200).json({
        success: true,
        data: null,
      });
    } catch (error: any) {
      console.error('❌ Error in DELETE /api/data/task-categories/:id:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete task category',
      });
    }
  });

  return router;
};
