import type { Request, Response } from 'express';
import { processConfirmAgentRun } from '../process-agent-run-actions';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles POST /api/data/agent-runs/:id/confirm (draft → running).
 */
export const postConfirmAgentRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const scope = Array.isArray(body.scope_change_ids) ? body.scope_change_ids.filter((item): item is string => typeof item === 'string') : undefined;
  console.log('📥 POST /api/data/agent-runs/:id/confirm', { id, scope: scope?.length });
  try {
    const run = await processConfirmAgentRun(client, id, {
      instructions: typeof body.instructions === 'string' ? body.instructions : undefined,
      scopeChangeIds: scope,
    });
    res.status(200).json({ success: true, data: run });
  } catch (error) {
    sendAgentError(res, 'Error in POST /api/data/agent-runs/:id/confirm', error);
  }
};
