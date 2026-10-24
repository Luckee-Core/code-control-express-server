import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListProjects } from '../process-list-projects';

/**
 * Handles GET /api/data/projects.
 */
export const getProjectsHandler = async (_req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  try {
    const projects = await processListProjects(client);
    res.status(200).json({ success: true, data: projects, count: projects.length });
  } catch (error) {
    logHandlerError('Error in GET /api/data/projects', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
