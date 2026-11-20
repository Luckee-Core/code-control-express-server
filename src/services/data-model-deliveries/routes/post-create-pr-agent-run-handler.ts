import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCreatePrAgentRun } from '../../agent-runs/process-agent-run-actions';
import { sendAgentError } from '../../agent-runs/routes/send-agent-error';

/**
 * Handles POST /api/data/data-model-deliveries/:id/pr-agent-runs (Update PR: feedback → PR agent run).
 * Body: { feedback, focus_paths?, run_now? } — run_now starts it instead of saving a draft.
 */
export const postCreatePrAgentRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Delivery id is required' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const feedback = typeof body.feedback === 'string' ? body.feedback : '';
  if (!feedback.trim()) {
    res.status(400).json({ success: false, error: 'feedback is required' });
    return;
  }
  const focusPaths = Array.isArray(body.focus_paths) ? body.focus_paths.filter((item): item is string => typeof item === 'string') : [];
  console.log('📥 POST /api/data/data-model-deliveries/:id/pr-agent-runs', { id, runNow: body.run_now === true });
  try {
    const run = await processCreatePrAgentRun(client, { deliveryId: id, feedback, focusPaths, runNow: body.run_now === true });
    res.status(201).json({ success: true, data: run });
  } catch (error) {
    sendAgentError(res, 'Error in POST /api/data/data-model-deliveries/:id/pr-agent-runs', error);
  }
};
