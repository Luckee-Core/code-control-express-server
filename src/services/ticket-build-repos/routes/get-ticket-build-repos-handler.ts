import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListTicketBuildRepos } from '../process-list-ticket-build-repos';
import { sendTicketBuildError } from '../../ticket-builds/routes/send-ticket-build-error';

/**
 * Handles GET /api/data/ticket-build-repos?ticket_build_id=
 */
export const getTicketBuildReposHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const ticketBuildId = typeof req.query.ticket_build_id === 'string' ? req.query.ticket_build_id.trim() : '';
  if (!ticketBuildId) {
    res.status(400).json({ success: false, error: 'ticket_build_id is required' });
    return;
  }
  try {
    const data = await processListTicketBuildRepos(client, ticketBuildId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendTicketBuildError(res, 'Error in GET /api/data/ticket-build-repos', error);
  }
};
