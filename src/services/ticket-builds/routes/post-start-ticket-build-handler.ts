import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processStartTicketBuild } from '../process-start-ticket-build';
import { sendTicketBuildError } from './send-ticket-build-error';

/**
 * Handles POST /api/data/ticket-builds/:id/start: approves the plan and starts one Cursor agent per
 * included repo. Responds 202; poll GET /:id for PRs.
 */
export const postStartTicketBuildHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  console.log('📥 POST /api/data/ticket-builds/:id/start', { id: req.params.id });
  try {
    const data = await processStartTicketBuild(client, String(req.params.id));
    res.status(202).json({ success: true, data });
  } catch (error) {
    sendTicketBuildError(res, 'Error in POST /api/data/ticket-builds/:id/start', error);
  }
};
