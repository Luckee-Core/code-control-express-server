import { Router, Request, Response } from 'express';
import { getAllDataEntityGenerationTasks } from './get-all';

export const createDataEntityGenerationTasksRouter = (): Router => {
  const router = Router();

  /**
   * GET /api/data-entity-generation-tasks
   * Get all available generation tasks
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const tasks = await getAllDataEntityGenerationTasks();
      res.json(tasks);
    } catch (error: any) {
      console.error('❌ Error in GET /data-entity-generation-tasks:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
