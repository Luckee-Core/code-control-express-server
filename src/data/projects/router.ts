/**
 * Customer Projects Router
 */

import { Router, Request, Response } from 'express';
import { requirePgPool } from '../../utils/http/require-pg-pool';
import {
  getAllProjects,
  getProjectsByCustomerId,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from './index';

/**
 * Creates the projects data router.
 */
export const createProjectsRouter = (): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
      const pool = requirePgPool(res);
      if (!pool) return;

      const projects = await getAllProjects(pool);
      res.status(200).json({ success: true, data: projects, count: projects.length });
    } catch (error) {
      console.error('Error in GET /api/data/projects:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.get('/customer/:customerId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      if (!customerId || Array.isArray(customerId)) {
        res.status(400).json({ success: false, error: 'Invalid customer ID' });
        return;
      }
      const pool = requirePgPool(res);
      if (!pool) return;

      const projects = await getProjectsByCustomerId(pool, customerId);
      res.status(200).json({ success: true, data: projects, count: projects.length });
    } catch (error) {
      console.error('Error in GET /api/data/projects/customer/:customerId:', error);
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
      const pool = requirePgPool(res);
      if (!pool) return;

      const project = await getProjectById(pool, id);
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
      const { customer_id, name, description } = req.body;
      if (!customer_id || !name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({
          success: false,
          error: 'customer_id and name are required',
        });
        return;
      }
      const pool = requirePgPool(res);
      if (!pool) return;

      const project = await createProject(pool, {
        customer_id,
        name: name.trim(),
        description: description?.trim() ?? null,
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
      const pool = requirePgPool(res);
      if (!pool) return;

      const project = await updateProject(pool, id, {
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
      const pool = requirePgPool(res);
      if (!pool) return;

      await deleteProject(pool, id);
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
