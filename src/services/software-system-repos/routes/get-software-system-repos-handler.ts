import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListSoftwareSystemRepos } from '../process-list-project-repos';

/**
 * Handles GET /api/data/project-repos.
 */
export const getSoftwareSystemReposHandler = async (_req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  try {
    const repos = await processListSoftwareSystemRepos(client);
    res.status(200).json({ success: true, data: repos, count: repos.length });
  } catch (error) {
    logHandlerError('Error in GET /api/data/project-repos', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
