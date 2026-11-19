import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processListTicketBuildAiExchanges } from '../process-list-ticket-build-ai-exchanges';

/**
 * Handles GET /api/data/ticket-build-ai-exchanges?ticket_build_id=
 */
export const getTicketBuildAiExchangesHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const ticketBuildId = typeof req.query.ticket_build_id === 'string' ? req.query.ticket_build_id.trim() : '';
  if (!ticketBuildId) {
    res.status(400).json({ success: false, error: 'ticket_build_id is required' });
    return;
  }
  try {
    const data = await processListTicketBuildAiExchanges(client, ticketBuildId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendHandlerError(res, 'Error in GET /api/data/ticket-build-ai-exchanges', error);
  }
};
