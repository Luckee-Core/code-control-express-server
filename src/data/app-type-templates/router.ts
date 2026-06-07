/**
 * App Type Templates Router
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getAllAppTypeTemplates, getAppTypeTemplate } from './index';

export const createAppTypeTemplatesRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const templates = await getAllAppTypeTemplates(supabase);
      res.status(200).json({
        success: true,
        data: templates,
        count: templates.length,
      });
    } catch (error) {
      console.error('Error in GET /app-type-templates:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.get('/by-app-type/:appType', async (req: Request, res: Response): Promise<void> => {
    try {
      const { appType } = req.params;
      if (!appType || Array.isArray(appType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid app type',
        });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const result = await getAppTypeTemplate(supabase, appType);
      if (!result.success) {
        res.status(404).json({
          success: false,
          error: result.error,
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Error in GET /app-type-templates/by-app-type/:appType:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
