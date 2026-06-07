import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import {
  getAllCrudApiQueue,
  createCrudApiQueueBatch,
  createTableNamesConfigQueueItem,
  updateCrudApiQueueStatus,
  deleteCrudApiQueueItem,
} from './index';
import { mergePullRequest } from '../../services/github';

export const createCrudApiGenerationQueueRouter = (): Router => {
  const router = Router();

  // POST /crud-api-generation-queue/repo/:repoId/table-names-config - Enqueue table names config for repo
  router.post('/repo/:repoId/table-names-config', async (req: Request, res: Response) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const repoId = typeof req.params.repoId === 'string' ? req.params.repoId : req.params.repoId?.[0];
      if (!repoId) {
        return res.status(400).json({ success: false, error: 'Missing repoId' });
      }

      const { data: repo, error: repoError } = await supabase
        .from('project_repos')
        .select('id, project_id')
        .eq('id', repoId)
        .single();

      if (repoError || !repo) {
        return res.status(404).json({ success: false, error: 'Repo not found' });
      }

      const projectId = (repo as { project_id: string }).project_id;
      const item = await createTableNamesConfigQueueItem(supabase, {
        project_id: projectId,
        repo_id: repoId,
      });

      return res.status(201).json({ success: true, item });
    } catch (error: any) {
      console.error('❌ Error enqueueing table names config:', error);
      return res.status(500).json({ success: false, error: error?.message ?? 'Unknown error' });
    }
  });

  // GET /crud-api-generation-queue - Get all queue items
  router.get('/', async (req: Request, res: Response) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const items = await getAllCrudApiQueue(supabase);
      res.json({ success: true, items });
    } catch (error: any) {
      console.error('❌ Error fetching CRUD API queue:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /crud-api-generation-queue/batch - Create multiple queue items
  router.post('/batch', async (req: Request, res: Response) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Items array required' });
      }

      const createdItems = await createCrudApiQueueBatch(supabase, items);
      res.json({ success: true, items: createdItems });
    } catch (error: any) {
      console.error('❌ Error creating CRUD API queue items:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /crud-api-generation-queue/:queueItemId/merge-pr - Merge the PR for this queue item
  router.post('/:queueItemId/merge-pr', async (req: Request, res: Response) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const queueItemId = typeof req.params.queueItemId === 'string'
        ? req.params.queueItemId
        : req.params.queueItemId?.[0];
      if (!queueItemId) {
        return res.status(400).json({ success: false, error: 'Missing queueItemId' });
      }

      const { data: item, error: fetchError } = await supabase
        .from('crud_api_generation_queue')
        .select('id, pr_link, status')
        .eq('id', queueItemId)
        .single();

      if (fetchError || !item) {
        return res.status(404).json({ success: false, error: 'Queue item not found' });
      }
      if (!item.pr_link) {
        return res.status(400).json({ success: false, error: 'No PR link for this queue item' });
      }
      if (item.status !== 'completed') {
        return res.status(400).json({ success: false, error: 'Only completed items can be merged' });
      }

      await mergePullRequest(item.pr_link);
      return res.status(200).json({ success: true, merged: true });
    } catch (error: any) {
      const message = error?.message ?? 'Unknown error';
      console.error('❌ Error merging PR:', error);
      if (message.includes('already merged')) {
        return res.status(405).json({ success: false, error: message });
      }
      if (message.includes('conflict')) {
        return res.status(409).json({ success: false, error: message });
      }
      return res.status(500).json({ success: false, error: message });
    }
  });

  // PATCH /crud-api-generation-queue/:queueItemId - Update status (e.g. retry = set status to queued)
  router.patch('/:queueItemId', async (req: Request, res: Response) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const queueItemId = typeof req.params.queueItemId === 'string'
        ? req.params.queueItemId
        : req.params.queueItemId?.[0];
      if (!queueItemId) {
        return res.status(400).json({ success: false, error: 'Missing queueItemId' });
      }

      const { status, pr_link, error: errorMessage } = req.body;

      const updates: Record<string, unknown> = {};
      if (status !== undefined) updates.status = status;
      if (pr_link !== undefined) updates.pr_link = pr_link;
      if (errorMessage !== undefined) updates.error = errorMessage;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No updates provided' });
      }

      const updated = await updateCrudApiQueueStatus(supabase, queueItemId, updates as any);
      res.json(updated);
    } catch (error: any) {
      console.error('❌ Error updating CRUD API queue item:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /crud-api-generation-queue/:queueItemId
  router.delete('/:queueItemId', async (req: Request, res: Response) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const queueItemId = typeof req.params.queueItemId === 'string'
        ? req.params.queueItemId
        : req.params.queueItemId?.[0];
      if (!queueItemId) {
        return res.status(400).json({ success: false, error: 'Missing queueItemId' });
      }
      await deleteCrudApiQueueItem(supabase, queueItemId);
      res.json({ success: true, message: 'Queue item deleted' });
    } catch (error: any) {
      console.error('❌ Error deleting CRUD API queue item:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
