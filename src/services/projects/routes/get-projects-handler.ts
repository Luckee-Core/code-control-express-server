import type { Request, Response } from 'express';
import { requireStorageClient } from '../../../utils/http/require-storage-client';
import { processListProjects } from '../process-list-projects';

/**
 * Handles GET /api/data/projects.
 */
export const getProjectsHandler = async (_req: Request, res: Response): Promise<void> => {
  const storage = requireStorageClient(res);
  if (!storage) return;

  try {
    const projects = await processListProjects(storage);
    res.status(200).json({ success: true, data: projects, count: projects.length });
  } catch (error) {
    console.error('❌ Error in GET /api/data/projects:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
