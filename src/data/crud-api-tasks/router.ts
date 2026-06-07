import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getAllCrudApiTasks } from './index';

export const createCrudApiTasksRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const tasks = await getAllCrudApiTasks(supabase);
      res.status(200).json({
        success: true,
        data: tasks,
        count: tasks.length,
        message: 'CRUD API tasks retrieved successfully',
      });
    } catch (error) {
      console.error('❌ Error in GET /api/data/crud-api-tasks:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch CRUD API tasks',
      });
    }
  });

  return router;
};
