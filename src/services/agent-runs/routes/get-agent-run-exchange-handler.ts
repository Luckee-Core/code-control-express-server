import type { Request, Response } from 'express';
import { processGetAgentRunExchange } from '../process-agent-run-queries';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendAgentError } from './send-agent-error';

/**
 * Handles GET /api/data/agent-runs/:id/exchanges/:exchangeId (prompt and response bodies).
 */
export const getAgentRunExchangeHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Agent run id is required' });
    return;
  }
  const exchangeId = readRouteParam(req, 'exchangeId');
  if (!exchangeId) {
    res.status(400).json({ success: false, error: 'exchangeId is required' });
    return;
  }
  try {
    res.status(200).json({ success: true, data: await processGetAgentRunExchange(client, id, exchangeId) });
  } catch (error) {
    sendAgentError(res, 'Error in GET /api/data/agent-runs/:id/exchanges/:exchangeId', error);
  }
};
