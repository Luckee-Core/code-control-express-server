/**
 * Build Examples Router
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import {
  getAllBuildExamples,
  getBuildExampleById,
  createBuildExample,
  updateBuildExample,
  deleteBuildExample,
} from './index';

export const createBuildExamplesRouter = (): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const list = await getAllBuildExamples(supabase);
      res.status(200).json({ success: true, data: list, count: list.length });
    } catch (error) {
      console.error('Error in GET /api/data/build-examples:', error);
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
      const item = await getBuildExampleById(supabase, id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Build example not found' });
        return;
      }
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in GET /api/data/build-examples/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, tags, language, code } = req.body;
      if (!name || !language || typeof code !== 'string') {
        res.status(400).json({
          success: false,
          error: 'name, language, and code are required',
        });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const item = await createBuildExample(supabase, {
        name: name.trim(),
        tags: Array.isArray(tags) ? tags : [],
        language: language.trim(),
        code,
      });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in POST /api/data/build-examples:', error);
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
      const { name, tags, language, code } = req.body;
      const supabase = getManagedSupabaseClient();
      const item = await updateBuildExample(supabase, id, {
        ...(name !== undefined && { name }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
        ...(language !== undefined && { language }),
        ...(code !== undefined && { code }),
      });
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in PATCH /api/data/build-examples/:id:', error);
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
      await deleteBuildExample(supabase, id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in DELETE /api/data/build-examples/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
