import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCreateProject } from '../process-create-project';

/**
 * Handles POST /api/data/projects.
 */
export const postCreateProjectHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { customer_id, name, description } = req.body ?? {};
  if (!customer_id || !name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ success: false, error: 'customer_id and name are required' });
    return;
  }

  console.log('📥 POST /api/data/projects');
  try {
    const project = await processCreateProject(client, {
      customer_id,
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : null,
    });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    logHandlerError('Error in POST /api/data/projects', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
