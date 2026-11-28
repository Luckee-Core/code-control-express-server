import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processRecordSoftwareSystemOpen } from '../process-record-software-system-open';

/**
 * Handles POST /api/data/software-systems/:id/opens.
 */
export const postSoftwareSystemOpenHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid software system ID' });
    return;
  }

  try {
    const open = await processRecordSoftwareSystemOpen(client, id);
    if (!open) {
      res.status(404).json({ success: false, error: 'Software system not found' });
      return;
    }
    res.status(201).json({ success: true, data: open });
  } catch (error) {
    logHandlerError('Error in POST /api/data/software-systems/:id/opens', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
