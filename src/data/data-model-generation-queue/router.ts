import { Router } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getDataModelQueueByRepo } from './get-by-repo';
import { createBatchDataModelQueue } from './create-batch';
import { getDueDataModelQueueItems } from './get-due-items';
import { updateDataModelQueueStatus } from './update-status';
import { deleteDataModelQueueItem } from './delete';
import { processDataModelQueue } from '../../services/data-model-generation';

export const createDataModelGenerationQueueRouter = (): Router => {
  const router = Router();

  // GET /api/data/data-model-generation-queue
  router.get('/', async (req, res) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data: queue, error } = await supabase
        .from('data_model_generation_queue')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({ success: true, data: queue });
    } catch (error: any) {
      console.error('❌ Error in GET /:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/data/data-model-generation-queue/repo/:repoId
  router.get('/repo/:repoId', async (req, res) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const queue = await getDataModelQueueByRepo(supabase, req.params.repoId);
      res.json({ success: true, data: queue });
    } catch (error: any) {
      console.error('❌ Error in GET /repo/:repoId:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/data/data-model-generation-queue/batch
  router.post('/batch', async (req, res) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { project_id, repo_id, entity_ids } = req.body;

      if (!project_id || !repo_id || !Array.isArray(entity_ids)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: project_id, repo_id, entity_ids',
        });
      }

      const queueItems = await createBatchDataModelQueue(supabase, {
        project_id,
        repo_id,
        entity_ids,
      });

      res.json({ success: true, data: queueItems });
    } catch (error: any) {
      console.error('❌ Error in POST /batch:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/data/data-model-generation-queue/process-due
  router.post('/process-due', async (req, res) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const result = await processDataModelQueue(supabase);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('❌ Error in POST /process-due:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PATCH /api/data/data-model-generation-queue/:queueItemId
  router.patch('/:queueItemId', async (req, res) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { queueItemId } = req.params;
      const { status, started_at, completed_at, error_message, cursor_exchange_id, file_content } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'Missing required field: status' });
      }

      await updateDataModelQueueStatus(supabase, queueItemId, {
        status,
        ...(started_at && { started_at }),
        ...(completed_at && { completed_at }),
        ...(error_message !== undefined && { error_message }),
        ...(cursor_exchange_id && { cursor_exchange_id }),
        ...(file_content !== undefined && { file_content }),
      });

      // Fetch and return the updated item
      const { data: updatedItem, error } = await supabase
        .from('data_model_generation_queue')
        .select('*')
        .eq('id', queueItemId)
        .single();

      if (error) {
        throw error;
      }

      res.json(updatedItem);
    } catch (error: any) {
      console.error('❌ Error in PATCH /:queueItemId:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/data/data-model-generation-queue/:queueItemId
  router.delete('/:queueItemId', async (req, res) => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { queueItemId } = req.params;
      await deleteDataModelQueueItem(supabase, queueItemId);
      
      res.json({ success: true, message: 'Queue item deleted' });
    } catch (error: any) {
      console.error('❌ Error in DELETE /:queueItemId:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
