import type { Request, Response } from 'express';
import { processGetAgentRunDetail } from '../process-agent-run-queries';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles GET /api/data/agent-runs/:id.
 */
export const getAgentRunDetailHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  try {
    res.status(200).json({ success: true, data: await processGetAgentRunDetail(client, id) });
  } catch (error) {
    sendAgentError(res, 'Error in GET /api/data/agent-runs/:id', error);
  }
};
