/**
 * Data Entities Router
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import {
  getDataEntitiesByProjectId,
  getAllDataEntities,
  createDataEntity,
  updateDataEntity,
  deleteDataEntity,
} from './index';

export const createDataEntitiesRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.query.project_id as string;
      
      if (projectId) {
        const supabase = getManagedSupabaseClient();
        const list = await getDataEntitiesByProjectId(supabase, projectId);
        res.status(200).json({ success: true, data: list, count: list.length });
      } else {
        const list = await getAllDataEntities();
        res.status(200).json({ success: true, data: list, count: list.length });
      }
    } catch (error) {
      console.error('Error in GET /api/data/data-entities:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { project_id, name, table_name, sort_order } = req.body;
      if (!project_id || !name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          error: 'project_id and name are required',
        });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const item = await createDataEntity(supabase, {
        project_id,
        name: name.trim(),
        table_name: table_name ?? null,
        sort_order,
      });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in POST /api/data/data-entities:', error);
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
      const { name, table_name, sort_order, assigned_repo_ids } = req.body;
      const supabase = getManagedSupabaseClient();
      const item = await updateDataEntity(supabase, id, {
        ...(name !== undefined && { name }),
        ...(table_name !== undefined && { table_name }),
        ...(sort_order !== undefined && { sort_order }),
        ...(assigned_repo_ids !== undefined && { assigned_repo_ids }),
      });
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in PATCH /api/data/data-entities/:id:', error);
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
      await deleteDataEntity(supabase, id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in DELETE /api/data/data-entities/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
