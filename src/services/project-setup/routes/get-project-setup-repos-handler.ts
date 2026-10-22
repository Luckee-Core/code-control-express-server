import type { Request, Response } from 'express';
import { requireStorageClient } from '../../../utils/http/require-storage-client';
import { processListProjectSetupRepos } from '../process-list-project-setup-repos';

/**
 * Handles GET /api/data/projects/:id/project-setup/repos.
 */
export const getProjectSetupReposHandler = async (req: Request, res: Response): Promise<void> => {
  const storage = requireStorageClient(res);
  if (!storage) return;

  const projectId = req.params.id;
  if (!projectId || Array.isArray(projectId)) {
    res.status(400).json({ success: false, error: 'Invalid project ID' });
    return;
  }

  try {
    const repos = await processListProjectSetupRepos(storage, projectId);
    res.status(200).json({ success: true, data: repos, count: repos.length });
  } catch (error) {
    console.error('❌ Error in GET project-setup/repos:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
