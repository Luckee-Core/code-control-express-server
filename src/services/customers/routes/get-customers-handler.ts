import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireStorageClient } from '../../../utils/http/require-storage-client';
import { processListCustomers } from '../process-list-customers';

/**
 * Handles GET /api/data/customers (optional ?stage=).
 */
export const getCustomersHandler = async (req: Request, res: Response): Promise<void> => {
  const storage = requireStorageClient(res);
  if (!storage) return;

  const stage = typeof req.query.stage === 'string' ? req.query.stage : undefined;

  try {
    const customers = await processListCustomers(storage, stage);
    res.status(200).json({ success: true, data: customers, count: customers.length });
  } catch (error) {
    logHandlerError('Error in GET /api/data/customers', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
