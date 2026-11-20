import type { Request, Response } from 'express';
import { processRejectAgentRun } from '../process-agent-run-actions';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles POST /api/data/agent-runs/:id/reject (ends the chain; template: optional revert).
 */
export const postRejectAgentRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  console.log('📥 POST /api/data/agent-runs/:id/reject', { id });
  try {
    const result = await processRejectAgentRun(client, id, { note: typeof body.note === 'string' ? body.note : '', revertChanges: body.revert_changes === true });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    sendAgentError(res, 'Error in POST /api/data/agent-runs/:id/reject', error);
  }
};
