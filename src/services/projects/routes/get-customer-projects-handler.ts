import type { Request, Response } from 'express';
import { requireStorageClient } from '../../../utils/http/require-storage-client';
import { processListCustomerProjects } from '../process-list-customer-projects';

/**
 * Handles GET /api/data/projects/customer/:customerId.
 */
export const getCustomerProjectsHandler = async (req: Request, res: Response): Promise<void> => {
  const storage = requireStorageClient(res);
  if (!storage) return;

  const { customerId } = req.params;
  if (!customerId || Array.isArray(customerId)) {
    res.status(400).json({ success: false, error: 'Invalid customer ID' });
    return;
  }

  try {
    const projects = await processListCustomerProjects(storage, customerId);
    res.status(200).json({ success: true, data: projects, count: projects.length });
  } catch (error) {
    console.error('❌ Error in GET /api/data/projects/customer/:customerId:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
