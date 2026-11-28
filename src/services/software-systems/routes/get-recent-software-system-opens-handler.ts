import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListRecentSoftwareSystemOpens } from '../process-list-recent-software-system-opens';

/**
 * Handles GET /api/data/software-systems/recent-opens?limit=5.
 */
export const getRecentSoftwareSystemOpensHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const rawLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : null;

  try {
    const opens = await processListRecentSoftwareSystemOpens(client, rawLimit);
    res.status(200).json({ success: true, data: opens, count: opens.length });
  } catch (error) {
    logHandlerError('Error in GET /api/data/software-systems/recent-opens', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
