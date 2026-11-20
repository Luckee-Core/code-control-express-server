import type { Request, Response } from 'express';
import { processUpdateDraftAgentRun } from '../process-agent-run-actions';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles PATCH /api/data/agent-runs/:id (edit a draft: instructions, PR feedback, focus files).
 */
export const patchAgentRunDraftHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const focusPaths = Array.isArray(body.focus_paths) ? body.focus_paths.filter((item): item is string => typeof item === 'string') : undefined;
  try {
    const run = await processUpdateDraftAgentRun(client, id, {
      instructions: typeof body.instructions === 'string' ? body.instructions : undefined,
      feedback: typeof body.feedback === 'string' ? body.feedback : undefined,
      focusPaths,
    });
    res.status(200).json({ success: true, data: run });
  } catch (error) {
    sendAgentError(res, 'Error in PATCH /api/data/agent-runs/:id', error);
  }
};
