import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../services/managed';
import { getAllWorkspaces, getWorkspaceById, createWorkspace } from './index';

/**
 * Workspaces router.
 */
export const createWorkspacesRouter = (): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        res.status(500).json({ success: false, error: 'Service unavailable' });
        return;
      }
      const workspaces = await getAllWorkspaces(supabase);
      res.status(200).json({ success: true, data: workspaces, count: workspaces.length });
    } catch (error) {
      console.error('❌ GET /workspaces:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid workspace ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        res.status(500).json({ success: false, error: 'Service unavailable' });
        return;
      }
      const workspace = await getWorkspaceById(supabase, id);
      if (!workspace) {
        res.status(404).json({ success: false, error: 'Workspace not found' });
        return;
      }
      res.status(200).json({ success: true, data: workspace });
    } catch (error) {
      console.error('❌ GET /workspaces/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, slug } = req.body;
      if (!name || !slug || typeof name !== 'string' || typeof slug !== 'string') {
        res.status(400).json({ success: false, error: 'name and slug are required' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        res.status(500).json({ success: false, error: 'Service unavailable' });
        return;
      }
      const workspace = await createWorkspace(supabase, { name, slug });
      res.status(201).json({ success: true, data: workspace });
    } catch (error) {
      console.error('❌ POST /workspaces:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
};
