import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListSoftwareSystemSetupRepos } from '../process-list-software-system-setup-repos';

/**
 * Handles GET /api/data/software-systems/:id/software-system-setup/repos.
 */
export const getSoftwareSystemSetupReposHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const projectId = req.params.id;
  if (!projectId || Array.isArray(projectId)) {
    res.status(400).json({ success: false, error: 'Invalid project ID' });
    return;
  }

  try {
    const repos = await processListSoftwareSystemSetupRepos(client, projectId);
    res.status(200).json({ success: true, data: repos, count: repos.length });
  } catch (error) {
    logHandlerError('Error in GET software-system-setup/repos', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
