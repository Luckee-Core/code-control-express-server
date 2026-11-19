import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processReviseTicketBuild } from '../process-revise-ticket-build';
import { sendTicketBuildError } from './send-ticket-build-error';

/**
 * Handles POST /api/data/ticket-builds/:id/revise { feedback }. Responds 202; poll GET /:id.
 */
export const postReviseTicketBuildHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const feedback = typeof body.feedback === 'string' ? body.feedback : '';
  console.log('📥 POST /api/data/ticket-builds/:id/revise', { id: req.params.id, feedback_chars: feedback.length });
  try {
    const data = await processReviseTicketBuild(client, String(req.params.id), { feedback });
    res.status(202).json({ success: true, data });
  } catch (error) {
    sendTicketBuildError(res, 'Error in POST /api/data/ticket-builds/:id/revise', error);
  }
};
