import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListSoftwareSystems } from '../process-list-software-systems';

/**
 * Handles GET /api/data/software-systems.
 */
export const getSoftwareSystemsHandler = async (_req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  try {
    const projects = await processListSoftwareSystems(client);
    res.status(200).json({ success: true, data: projects, count: projects.length });
  } catch (error) {
    logHandlerError('Error in GET /api/data/software-systems', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
