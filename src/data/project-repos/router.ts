/**
 * Customer Project Repos Router
 */

import { Router, Request, Response } from 'express';
import { getAllProjectRepos } from './index';

export const createProjectReposRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const repos = await getAllProjectRepos();
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
