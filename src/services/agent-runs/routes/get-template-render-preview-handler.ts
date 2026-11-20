import type { Request, Response } from 'express';
import { processGetTemplateRenderPreview } from '../process-template-run-views';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles GET /api/data/agent-runs/:id/render-preview?repo=owner/name (generated code before/after the template PR).
 */
export const getTemplateRenderPreviewHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const repo = typeof req.query.repo === 'string' ? req.query.repo.trim() : '';
  try {
    res.status(200).json({ success: true, data: await processGetTemplateRenderPreview(client, id, repo) });
  } catch (error) {
    sendAgentError(res, 'Error in GET /api/data/agent-runs/:id/render-preview', error);
  }
};
