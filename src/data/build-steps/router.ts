/**
 * Build Steps Router
 * Express router factory for build steps CRUD operations
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getAllBuildSteps } from './get-all';
import { getBuildStepById } from './get-by-id';
import { createBuildStep } from './create';
import { updateBuildStep } from './update';
import { deleteBuildStep } from './delete';

export const createBuildStepsRouter = (): Router => {
  const router = Router();

  // GET /api/data/build-steps
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const data = await getAllBuildSteps(supabase);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in GET /api/data/build-steps:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch build steps',
      });
    }
  });

  // GET /api/data/build-steps/:id
  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await getBuildStepById(supabase, id);
      
      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Build step not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in GET /api/data/build-steps/:id:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch build step',
      });
    }
  });

  // POST /api/data/build-steps
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const data = await createBuildStep(supabase, req.body);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in POST /api/data/build-steps:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create build step',
      });
    }
  });

  // PATCH /api/data/build-steps/:id
  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await updateBuildStep(supabase, id, req.body);
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('❌ Error in PATCH /api/data/build-steps/:id:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update build step',
      });
    }
  });

  // DELETE /api/data/build-steps/:id
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await deleteBuildStep(supabase, id);
      
      res.status(200).json({
        success: true,
        data: null,
      });
    } catch (error: any) {
      console.error('❌ Error in DELETE /api/data/build-steps/:id:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete build step',
      });
    }
  });

  return router;
};
