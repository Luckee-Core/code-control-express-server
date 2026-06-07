/**
 * Code Generation Queue Router
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import {
  getAllQueueItems,
  deleteQueueItem,
} from './index';
import {
  addToQueue,
  addBatchToQueue,
} from '../../services/code-generation-queue/add-to-queue';
import { processDueQueueItems } from '../../services/code-generation-queue/process-due-queue-items';
import {
  getPRDetails,
  getPRFiles,
  approvePR,
  rejectPR,
  mergePR,
} from '../../services/github';
import { parsePRUrl } from '../../utils/parse-pr-url';

export const createCodeGenerationQueueRouter = (): Router => {
  const router = Router();

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        project_id,
        repo_id,
        entity_id,
        task_id,
        selected_task_id,
      } = req.body;

      if (!project_id || !repo_id || !entity_id || !task_id || !selected_task_id) {
        res.status(400).json({
          success: false,
          error: 'project_id, repo_id, entity_id, task_id, selected_task_id are required',
        });
        return;
      }

      const supabase = getManagedSupabaseClient();
      const result = await addToQueue(
        supabase,
        project_id,
        repo_id,
        entity_id,
        task_id,
        selected_task_id
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error || 'Failed to add to queue',
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.queueItem,
        message: 'Added to code generation queue',
      });
    } catch (error) {
      console.error('Error in POST /code-generation-queue:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/batch', async (req: Request, res: Response): Promise<void> => {
    try {
      const { project_id, repo_id, entity_ids, task_id } = req.body;

      if (!project_id || !repo_id || !entity_ids || !Array.isArray(entity_ids) || !task_id) {
        res.status(400).json({
          success: false,
          error: 'project_id, repo_id, entity_ids (array), task_id are required',
        });
        return;
      }

      const supabase = getManagedSupabaseClient();
      const result = await addBatchToQueue(
        supabase,
        project_id,
        repo_id,
        entity_ids,
        task_id
      );

      if (!result.success && !result.queueItems?.length) {
        res.status(400).json({
          success: false,
          error: result.error || 'Failed to add to queue',
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.queueItems || [],
        count: result.queueItems?.length || 0,
        message: `Added ${result.queueItems?.length || 0} item(s) to code generation queue`,
      });
    } catch (error) {
      console.error('Error in POST /code-generation-queue/batch:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const filters = {
        status: req.query.status as
          | 'queued'
          | 'processing'
          | 'completed'
          | 'failed'
          | undefined,
        project_id: req.query.project_id as string | undefined,
        entity_id: req.query.entity_id as string | undefined,
        task_id: req.query.task_id as string | undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
        offset: req.query.offset
          ? parseInt(req.query.offset as string, 10)
          : undefined,
      };

      const items = await getAllQueueItems(supabase, filters);

      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      console.error('Error in GET /code-generation-queue:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/:id/re-trigger', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid queue item ID' });
        return;
      }

      const supabase = getManagedSupabaseClient();

      const { data: existing, error: fetchError } = await supabase
        .from('code_generation_queue')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        res.status(500).json({
          success: false,
          error: fetchError.message || 'Failed to fetch queue item',
        });
        return;
      }

      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Queue item not found',
        });
        return;
      }

      if (existing.status === 'processing') {
        res.status(400).json({
          success: false,
          error: 'Cannot re-trigger item that is currently processing',
        });
        return;
      }

      const now = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from('code_generation_queue')
        .update({
          status: 'queued',
          scheduled_at: now,
          started_at: null,
          completed_at: null,
          error_message: null,
          cursor_exchange_id: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      console.log(`🔄 Re-triggered code generation queue item ${id}`);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Queue item re-triggered. It will be picked up by the next cron run.',
      });
    } catch (error) {
      console.error('Error in POST /code-generation-queue/:id/re-trigger:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid queue item ID' });
        return;
      }

      const supabase = getManagedSupabaseClient();
      await deleteQueueItem(supabase, id);

      res.status(200).json({
        success: true,
        message: 'Queue item deleted',
      });
    } catch (error) {
      console.error('Error in DELETE /code-generation-queue/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/process-due', async (req: Request, res: Response): Promise<void> => {
    console.log('📥 POST /api/data/code-generation-queue/process-due received');
    try {
      const supabase = getManagedSupabaseClient();
      const result = await processDueQueueItems(supabase);

      res.status(200).json({
        success: result.success,
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        errors: result.errors,
        message: `Processed ${result.processed} queue items`,
      });
    } catch (error) {
      console.error('Error in POST /code-generation-queue/process-due:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/:id/pr-details', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid queue item ID' });
        return;
      }

      const supabase = getManagedSupabaseClient();
      const { data: item, error: fetchError } = await supabase
        .from('code_generation_queue')
        .select(`
          id,
          cursor_generation_exchanges!cursor_exchange_id (
            cursor_generation_responses!response_id (
              pr_url
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        res.status(500).json({
          success: false,
          error: fetchError.message || 'Failed to fetch queue item',
        });
        return;
      }

      if (!item) {
        res.status(404).json({
          success: false,
          error: 'Queue item not found',
        });
        return;
      }

      const exchange = (item as any).cursor_generation_exchanges;
      const response = Array.isArray(exchange) ? exchange[0] : exchange;
      const prUrl = response?.cursor_generation_responses?.pr_url ?? null;

      if (!prUrl) {
        res.status(400).json({
          success: false,
          error: 'Queue item has no associated PR',
        });
        return;
      }

      const parsed = parsePRUrl(prUrl);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: parsed.error,
        });
        return;
      }

      const [detailsResult, filesResult] = await Promise.all([
        getPRDetails({
          owner: parsed.owner,
          repo: parsed.repo,
          pullNumber: parsed.pullNumber,
        }),
        getPRFiles({
          owner: parsed.owner,
          repo: parsed.repo,
          pullNumber: parsed.pullNumber,
        }),
      ]);

      if (!detailsResult.success) {
        res.status(500).json({
          success: false,
          error: detailsResult.error,
        });
        return;
      }

      const pr = detailsResult.pr;
      const files = filesResult.success ? filesResult.files : [];

      res.status(200).json({
        success: true,
        data: {
          ...pr,
          files,
          pr_url: prUrl,
        },
      });
    } catch (error) {
      console.error('Error in GET /code-generation-queue/:id/pr-details:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/:id/approve-pr', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { body: reviewBody } = req.body || {};
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid queue item ID' });
        return;
      }

      console.log(`📥 POST /code-generation-queue/${id}/approve-pr`);

      const { prUrl, parsed } = await resolvePRFromQueueItem(id);
      console.log(`🔍 Resolved PR URL: ${prUrl}, parsed:`, parsed);

      if (!prUrl || !parsed) {
        res.status(prUrl === null ? 404 : 400).json({
          success: false,
          error: prUrl === null ? 'Queue item not found' : 'Queue item has no associated PR',
        });
        return;
      }

      console.log(`🤖 Calling GitHub API to approve PR: ${parsed.owner}/${parsed.repo}#${parsed.pullNumber}`);

      const result = await approvePR({
        owner: parsed.owner,
        repo: parsed.repo,
        pullNumber: parsed.pullNumber,
        body: typeof reviewBody === 'string' ? reviewBody : undefined,
      });

      if (!result.success) {
        console.error(`❌ GitHub API error:`, result.error);
        res.status(500).json({ success: false, error: result.error });
        return;
      }

      console.log(`✅ PR approved successfully`);
      res.status(200).json({
        success: true,
        message: 'PR approved',
      });
    } catch (error) {
      console.error('Error in POST /code-generation-queue/:id/approve-pr:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/:id/reject-pr', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { body: reviewBody } = req.body || {};
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid queue item ID' });
        return;
      }

      const { prUrl, parsed } = await resolvePRFromQueueItem(id);
      if (!prUrl || !parsed) {
        res.status(prUrl === null ? 404 : 400).json({
          success: false,
          error: prUrl === null ? 'Queue item not found' : 'Queue item has no associated PR',
        });
        return;
      }

      const result = await rejectPR({
        owner: parsed.owner,
        repo: parsed.repo,
        pullNumber: parsed.pullNumber,
        body: typeof reviewBody === 'string' ? reviewBody : undefined,
      });

      if (!result.success) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'PR rejected (changes requested)',
      });
    } catch (error) {
      console.error('Error in POST /code-generation-queue/:id/reject-pr:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/:id/merge-pr', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { merge_method: mergeMethod } = req.body || {};
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid queue item ID' });
        return;
      }

      const { prUrl, parsed } = await resolvePRFromQueueItem(id);
      if (!prUrl || !parsed) {
        res.status(prUrl === null ? 404 : 400).json({
          success: false,
          error: prUrl === null ? 'Queue item not found' : 'Queue item has no associated PR',
        });
        return;
      }

      const validMethods = ['merge', 'squash', 'rebase'];
      const method = validMethods.includes(mergeMethod) ? mergeMethod : 'squash';

      const result = await mergePR({
        owner: parsed.owner,
        repo: parsed.repo,
        pullNumber: parsed.pullNumber,
        mergeMethod: method,
      });

      if (!result.success) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'PR merged',
        data: { sha: result.sha },
      });
    } catch (error) {
      console.error('Error in POST /code-generation-queue/:id/merge-pr:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
};

async function resolvePRFromQueueItem(
  itemId: string
): Promise<{
  prUrl: string | null;
  parsed: { owner: string; repo: string; pullNumber: number } | null;
}> {
  const supabase = getManagedSupabaseClient();
  const { data: item, error } = await supabase
    .from('code_generation_queue')
    .select(`
      cursor_generation_exchanges!cursor_exchange_id (
        cursor_generation_responses!response_id (
          pr_url
        )
      )
    `)
    .eq('id', itemId)
    .maybeSingle();

  if (error || !item) {
    return { prUrl: null, parsed: null };
  }

  const exchange = (item as any).cursor_generation_exchanges;
  const response = Array.isArray(exchange) ? exchange[0] : exchange;
  const prUrl = response?.cursor_generation_responses?.pr_url ?? null;

  if (!prUrl) {
    return { prUrl: '', parsed: null };
  }

  const parsed = parsePRUrl(prUrl);
  if (!parsed.success) {
    return { prUrl, parsed: null };
  }

  return {
    prUrl,
    parsed: { owner: parsed.owner, repo: parsed.repo, pullNumber: parsed.pullNumber },
  };
}
