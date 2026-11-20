import type { Request, Response } from 'express';
import { processRetryAgentRun } from '../process-agent-run-actions';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles POST /api/data/agent-runs/:id/retry (failed → running).
 */
export const postRetryAgentRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  try {
    res.status(200).json({ success: true, data: await processRetryAgentRun(client, id) });
  } catch (error) {
    sendAgentError(res, 'Error in POST /api/data/agent-runs/:id/retry', error);
  }
};
