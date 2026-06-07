import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import {
  getARDQueueByRepo,
  getARDQueueByProject,
  getAllARDGenerationQueue,
  createARDQueueItem,
  updateARDQueueStatus,
  deleteARDQueueItem,
} from './index';
import { processARDQueue } from '../../services/ard-generation';

export const createARDGenerationQueueRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const queue = await getAllARDGenerationQueue();
      res.json({ success: true, data: queue, count: queue.length });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/repo/:repoId', async (req: Request, res: Response) => {
    try {
      const repoId = req.params.repoId as string;
      const supabase = getManagedSupabaseClient();
      const queue = await getARDQueueByRepo(supabase, repoId);
      res.json(queue);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/project/:projectId', async (req: Request, res: Response) => {
    try {
      const projectId = req.params.projectId as string;
      const supabase = getManagedSupabaseClient();
      const queue = await getARDQueueByProject(supabase, projectId);
      res.json(queue);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const supabase = getManagedSupabaseClient();
      const queueItem = await createARDQueueItem(supabase, req.body);
      res.json(queueItem);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/batch', async (req: Request, res: Response) => {
    try {
      const { project_id, repo_id, task_ids } = req.body;
      console.log('📥 Batch ARD queue request received');
      console.log('📥 Project ID:', project_id);
      console.log('📥 Repo ID:', repo_id);
      console.log('📥 Task IDs:', task_ids);
      
      const supabase = getManagedSupabaseClient();
      
      const queueItems = [];
      for (const taskId of task_ids) {
        console.log('📥 Creating queue item for task:', taskId);
        const item = await createARDQueueItem(supabase, {
          project_id,
          repo_id,
          task_id: taskId,
        });
        console.log('📥 Queue item created:', item.id);
        queueItems.push(item);
      }
      
      console.log('✅ All queue items created:', queueItems.length);
      res.json(queueItems);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('❌ Error in batch queue creation:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const updates = req.body as { status?: 'queued' | 'processing' | 'completed' | 'failed' };
      const supabase = getManagedSupabaseClient();
      const updated = await updateARDQueueStatus(supabase, id, updates);
      res.json(updated);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const supabase = getManagedSupabaseClient();
      await deleteARDQueueItem(supabase, id);
      res.json({ success: true, message: 'Queue item deleted' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/process-due', async (req: Request, res: Response) => {
    console.log('📥 POST /api/data/ard-generation-queue/process-due received');
    try {
      const supabase = getManagedSupabaseClient();
      const result = await processARDQueue(supabase);
      
      res.status(200).json({
        success: true,
        triggered: result.triggered.length,
        skipped: result.skipped,
        processed: result.processed,
        message: `Processed ${result.triggered.length} ARD queue items`,
      });
    } catch (error) {
      console.error('Error in POST /ard-generation-queue/process-due:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
};
