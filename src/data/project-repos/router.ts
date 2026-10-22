/**
 * Customer Project Repos Router
 */

import { Router, Request, Response } from 'express';
import { requirePgPool } from '../../utils/http/require-pg-pool';
import { getAllProjectRepos } from './index';

/**
 * Creates the project-repos data router.
 */
export const createProjectReposRouter = (): Router => {
  const router = Router();

  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
      const pool = requirePgPool(res);
      if (!pool) return;

      const repos = await getAllProjectRepos(pool);
      res.status(200).json({ success: true, data: repos, count: repos.length });
    } catch (error) {
      console.error('Error in GET /api/data/project-repos:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
