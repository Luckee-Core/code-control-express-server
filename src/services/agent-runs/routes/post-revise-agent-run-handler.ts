import type { Request, Response } from 'express';
import { processReviseAgentRun } from '../process-agent-run-actions';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles POST /api/data/agent-runs/:id/revise (new version with feedback).
 */
export const postReviseAgentRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  console.log('📥 POST /api/data/agent-runs/:id/revise', { id });
  try {
    const run = await processReviseAgentRun(client, id, { feedback: typeof body.feedback === 'string' ? body.feedback : '', runNow: body.run_now !== false });
    res.status(200).json({ success: true, data: run });
  } catch (error) {
    sendAgentError(res, 'Error in POST /api/data/agent-runs/:id/revise', error);
  }
};
