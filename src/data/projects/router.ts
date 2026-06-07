/**
 * Customer Projects Router
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import {
  getAllProjects,
  getProjectsByWorkspaceId,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from './index';
export const createProjectsRouter = (): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      const projects = await getAllProjects(supabase);
      res.status(200).json({ success: true, data: projects, count: projects.length });
    } catch (error) {
      console.error('Error in GET /api/data/projects:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.get('/workspace/:workspaceId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      if (!workspaceId || Array.isArray(workspaceId)) {
        res.status(400).json({ success: false, error: 'Invalid customer ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const projects = await getProjectsByWorkspaceId(supabase, workspaceId);
      res.status(200).json({ success: true, data: projects, count: projects.length });
    } catch (error) {
      console.error('Error in GET /api/data/projects/workspace/:workspaceId:', error);
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
        res.status(400).json({ success: false, error: 'Invalid customer project ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const project = await getProjectById(supabase, id);
      if (!project) {
        res.status(404).json({ success: false, error: 'Customer project not found' });
        return;
      }
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      console.error('Error in GET /api/data/projects/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { workspace_id, name, description, app_type, external_customer_id } = req.body;
      if (!workspace_id || !name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({
          success: false,
          error: 'workspace_id and name are required',
        });
        return;
      }
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        res.status(500).json({ success: false, error: 'Service unavailable' });
        return;
      }
      const project = await createProject(supabase, {
        workspace_id,
        name: name.trim(),
        description: description?.trim() ?? null,
        app_type: app_type && typeof app_type === 'string' ? app_type : undefined,
        external_customer_id:
          external_customer_id && typeof external_customer_id === 'string'
            ? external_customer_id
            : null,
      });
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      console.error('Error in POST /api/data/projects:', error);
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
        res.status(400).json({ success: false, error: 'Invalid customer project ID' });
        return;
      }
      const { name, description } = req.body;
      const supabase = getManagedSupabaseClient();
      const project = await updateProject(supabase, id, {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      });
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      console.error('Error in PATCH /api/data/projects/:id:', error);
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
        res.status(400).json({ success: false, error: 'Invalid customer project ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      await deleteProject(supabase, id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in DELETE /api/data/projects/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
