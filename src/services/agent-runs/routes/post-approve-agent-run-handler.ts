import type { Request, Response } from 'express';
import type { ConventionDecision } from '../../convention-agent/approve-convention-agent-run';
import { processApproveAgentRun } from '../process-agent-run-actions';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles POST /api/data/agent-runs/:id/approve (apply output, create the next draft).
 */
export const postApproveAgentRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const decisions = Array.isArray(body.decisions)
    ? (body.decisions as Array<Record<string, unknown>>)
        .filter((item) => typeof item?.change_id === 'string' && (item.action === 'accept' || item.action === 'reject'))
        .map((item): ConventionDecision => ({
          change_id: item.change_id as string,
          action: item.action as ConventionDecision['action'],
          ...(item.after && typeof item.after === 'object' ? { after: item.after as Record<string, unknown> } : {}),
          ...(typeof item.reason === 'string' ? { reason: item.reason } : {}),
        }))
    : undefined;
  console.log('📥 POST /api/data/agent-runs/:id/approve', { id, decisions: decisions?.length });
  try {
    const result = await processApproveAgentRun(client, id, { note: typeof body.note === 'string' ? body.note : '', decisions });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    sendAgentError(res, 'Error in POST /api/data/agent-runs/:id/approve', error);
  }
};
