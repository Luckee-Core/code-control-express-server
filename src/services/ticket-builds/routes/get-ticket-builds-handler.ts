import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListTicketBuilds } from '../process-list-ticket-builds';
import { sendTicketBuildError } from './send-ticket-build-error';

/**
 * Handles GET /api/data/ticket-builds?software_system_id= | ?ops_ticket_id= (newest first).
 */
export const getTicketBuildsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const softwareSystemId = typeof req.query.software_system_id === 'string' ? req.query.software_system_id.trim() : '';
  const opsTicketId = typeof req.query.ops_ticket_id === 'string' ? req.query.ops_ticket_id.trim() : '';
  if (!softwareSystemId && !opsTicketId) {
    res.status(400).json({ success: false, error: 'software_system_id or ops_ticket_id is required' });
    return;
  }
  console.log('📥 GET /api/data/ticket-builds', { software_system_id: softwareSystemId, ops_ticket_id: opsTicketId });
  try {
    const data = await processListTicketBuilds(client, softwareSystemId ? { softwareSystemId } : { opsTicketId });
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendTicketBuildError(res, 'Error in GET /api/data/ticket-builds', error);
  }
};
