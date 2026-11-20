import type { Request, Response } from 'express';
import { processDismissAgentRun } from '../process-agent-run-actions';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles POST /api/data/agent-runs/:id/dismiss (drop a draft).
 */
export const postDismissAgentRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    const run = await processDismissAgentRun(client, id, { note: typeof body.note === 'string' ? body.note : '' });
    res.status(200).json({ success: true, data: run });
  } catch (error) {
    sendAgentError(res, 'Error in POST /api/data/agent-runs/:id/dismiss', error);
  }
};
