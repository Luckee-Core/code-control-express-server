import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processUpdateProject } from '../process-update-project';

/**
 * Handles PATCH /api/data/projects/:id.
 */
export const patchUpdateProjectHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid customer project ID' });
    return;
  }
  const { name, description } = req.body ?? {};

  console.log('📥 PATCH /api/data/projects/:id', { id });
  try {
    const project = await processUpdateProject(client, id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    });
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    logHandlerError('Error in PATCH /api/data/projects/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
