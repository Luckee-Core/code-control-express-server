import type { Request, Response } from 'express';
import { processGetTemplateRunDiff } from '../process-template-run-views';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles GET /api/data/agent-runs/:id/template-diff?repo=owner/name&scope=pr|run.
 */
export const getTemplateRunDiffHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const repo = typeof req.query.repo === 'string' ? req.query.repo.trim() : '';
  const scope = req.query.scope === 'run' ? 'run' : 'pr';
  try {
    res.status(200).json({ success: true, data: await processGetTemplateRunDiff(client, id, { repo, scope }) });
  } catch (error) {
    sendAgentError(res, 'Error in GET /api/data/agent-runs/:id/template-diff', error);
  }
};
