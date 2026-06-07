import { Router } from 'express';
import { getAllARDTasks } from './get-all';
import { getARDTasksByStackType } from './get-by-stack-type';

export const createARDTasksRouter = (): Router => {
  const router = Router();

  // GET /api/data/ard-tasks
  router.get('/', async (req, res) => {
    try {
      const tasks = await getAllARDTasks();
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      console.error('❌ Error fetching ARD tasks:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/data/ard-tasks/stack/:stackType
  router.get('/stack/:stackType', async (req, res) => {
    try {
      const { stackType } = req.params;
      
      if (!['express', 'nextjs', 'react-native'].includes(stackType)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid stack type. Must be: express, nextjs, or react-native' 
        });
      }

      const tasks = await getARDTasksByStackType(stackType as any);
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      console.error('❌ Error fetching ARD tasks by stack type:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
