import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetTemplateHeads } from '../process-template-run-views';
import { sendAgentError } from './send-agent-error';

/**
 * Handles GET /api/data/agent-runs/template-heads (each template repo's default-branch commit).
 */
export const getTemplateHeadsHandler = async (_req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  try {
    res.status(200).json({ success: true, data: await processGetTemplateHeads(client) });
  } catch (error) {
    sendAgentError(res, 'Error in GET /api/data/agent-runs/template-heads', error);
  }
};
