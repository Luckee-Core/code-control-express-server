import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetTicketBuild } from '../process-get-ticket-build';
import { sendTicketBuildError } from './send-ticket-build-error';

/**
 * Handles GET /api/data/ticket-builds/:id (polling target: syncs agents and PRs).
 */
export const getTicketBuildHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  try {
    const data = await processGetTicketBuild(client, String(req.params.id));
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendTicketBuildError(res, 'Error in GET /api/data/ticket-builds/:id', error);
  }
};
