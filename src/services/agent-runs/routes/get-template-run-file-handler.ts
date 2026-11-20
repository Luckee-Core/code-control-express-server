import type { Request, Response } from 'express';
import { processGetTemplateRunFile } from '../process-template-run-views';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles GET /api/data/agent-runs/:id/template-file?repo=owner/name&path=&at=base|head.
 */
export const getTemplateRunFileHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const path = typeof req.query.path === 'string' ? req.query.path.trim() : '';
  if (!path) {
    res.status(400).json({ success: false, error: 'path is required' });
    return;
  }
  const repo = typeof req.query.repo === 'string' ? req.query.repo.trim() : '';
  const at = req.query.at === 'base' ? 'base' : 'head';
  try {
    res.status(200).json({ success: true, data: await processGetTemplateRunFile(client, id, { repo, path, at }) });
  } catch (error) {
    sendAgentError(res, 'Error in GET /api/data/agent-runs/:id/template-file', error);
  }
};
