import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetAgentRunSummary } from '../process-agent-run-queries';
import { sendAgentError } from './send-agent-error';

/**
 * Handles GET /api/data/agent-runs/summary (open runs per agent, for sidebar badges).
 */
export const getAgentRunSummaryHandler = async (_req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  try {
    res.status(200).json({ success: true, data: await processGetAgentRunSummary(client) });
  } catch (error) {
    sendAgentError(res, 'Error in GET /api/data/agent-runs/summary', error);
  }
};
