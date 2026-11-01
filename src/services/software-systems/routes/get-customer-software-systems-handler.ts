import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListCustomerSoftwareSystems } from '../process-list-customer-software-systems';

/**
 * Handles GET /api/data/software-systems/customer/:customerId.
 */
export const getCustomerSoftwareSystemsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { customerId } = req.params;
  if (!customerId || Array.isArray(customerId)) {
    res.status(400).json({ success: false, error: 'Invalid customer ID' });
    return;
  }

  try {
    const projects = await processListCustomerSoftwareSystems(client, customerId);
    res.status(200).json({ success: true, data: projects, count: projects.length });
  } catch (error) {
    logHandlerError('Error in GET /api/data/software-systems/customer/:customerId', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
