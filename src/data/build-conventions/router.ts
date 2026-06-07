/**
 * Build Conventions Router
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import {
  getAllBuildConventions,
  getBuildConventionById,
  createBuildConvention,
  updateBuildConvention,
  deleteBuildConvention,
} from './index';

export const createBuildConventionsRouter = (): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const list = await getAllBuildConventions(supabase);
      res.status(200).json({ success: true, data: list, count: list.length });
    } catch (error) {
      console.error('Error in GET /api/data/build-conventions:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const item = await getBuildConventionById(supabase, id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Build convention not found' });
        return;
      }
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in GET /api/data/build-conventions/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, stack, content, tags } = req.body;
      if (!name || !stack || typeof content !== 'string') {
        res.status(400).json({
          success: false,
          error: 'name, stack, and content are required',
        });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const item = await createBuildConvention(supabase, {
        name: name.trim(),
        stack: stack.trim(),
        content,
        tags: Array.isArray(tags) ? tags : [],
      });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in POST /api/data/build-conventions:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }
      const { name, stack, content, tags } = req.body;
      const supabase = getManagedSupabaseClient();
      const item = await updateBuildConvention(supabase, id, {
        ...(name !== undefined && { name }),
        ...(stack !== undefined && { stack }),
        ...(content !== undefined && { content }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      });
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in PATCH /api/data/build-conventions/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      await deleteBuildConvention(supabase, id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in DELETE /api/data/build-conventions/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
