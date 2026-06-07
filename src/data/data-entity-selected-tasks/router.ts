import { Router, Request, Response } from 'express';
import { createDataEntitySelectedTask } from './create';
import { getAllDataEntitySelectedTasks } from './get-all';
import { getDataEntitySelectedTasksByEntity } from './get-by-entity';
import { updateDataEntitySelectedTask } from './update';
import { deleteDataEntitySelectedTask } from './delete';

export const createDataEntitySelectedTasksRouter = (): Router => {
  const router = Router();

  /**
   * GET /api/data-entity-selected-tasks/all
   * Get all selected tasks across all entities
   */
  router.get('/all', async (_req: Request, res: Response) => {
    try {
      const tasks = await getAllDataEntitySelectedTasks();
      res.json(tasks);
    } catch (error: any) {
      console.error('❌ Error in GET /data-entity-selected-tasks/all:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/data-entity-selected-tasks?entity_id=xxx
   * Get all selected tasks for an entity
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { entity_id } = req.query;
      
      if (!entity_id || typeof entity_id !== 'string') {
        return res.status(400).json({ error: 'entity_id query parameter is required' });
      }
      
      const tasks = await getDataEntitySelectedTasksByEntity(entity_id);
      res.json(tasks);
    } catch (error: any) {
      console.error('❌ Error in GET /data-entity-selected-tasks:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/data-entity-selected-tasks
   * Create a new selected task (user checks checkbox)
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { entity_id, task_id } = req.body;
      
      if (!entity_id || !task_id) {
        return res.status(400).json({ error: 'entity_id and task_id are required' });
      }
      
      const task = await createDataEntitySelectedTask({ entity_id, task_id });
      res.json(task);
    } catch (error: any) {
      console.error('❌ Error in POST /data-entity-selected-tasks:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/data-entity-selected-tasks/:id
   * Update a selected task
   */
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }
      
      const updates = req.body;
      
      const task = await updateDataEntitySelectedTask(id, updates);
      res.json(task);
    } catch (error: any) {
      console.error('❌ Error in PATCH /data-entity-selected-tasks/:id:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/data-entity-selected-tasks/:id
   * Delete a selected task (user unchecks checkbox)
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }
      
      await deleteDataEntitySelectedTask(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('❌ Error in DELETE /data-entity-selected-tasks/:id:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
