import type { Request, Response } from 'express';
import { requireStorageClient } from '../../../utils/http/require-storage-client';
import { processListProjectRepos } from '../process-list-project-repos';

/**
 * Handles GET /api/data/project-repos.
 */
export const getProjectReposHandler = async (_req: Request, res: Response): Promise<void> => {
  const storage = requireStorageClient(res);
  if (!storage) return;

  try {
    const repos = await processListProjectRepos(storage);
    res.status(200).json({ success: true, data: repos, count: repos.length });
  } catch (error) {
    console.error('❌ Error in GET /api/data/project-repos:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
