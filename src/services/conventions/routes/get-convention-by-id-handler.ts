import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetConventionDetail } from '../process-get-convention-detail';

/**
 * Handles GET /api/data/conventions/:id.
 */
export const getConventionByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid convention ID' });
    return;
  }

  try {
    const detail = await processGetConventionDetail(client, id);
    if (!detail) {
      res.status(404).json({ success: false, error: 'Convention not found' });
      return;
    }
    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    logHandlerError('Error in GET /api/data/conventions/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
