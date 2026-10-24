import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetProject } from '../process-get-project';

/**
 * Handles GET /api/data/projects/:id.
 */
export const getProjectByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid customer project ID' });
    return;
  }

  try {
    const project = await processGetProject(client, id);
    if (!project) {
      res.status(404).json({ success: false, error: 'Customer project not found' });
      return;
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    logHandlerError('Error in GET /api/data/projects/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
