import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCreateTicketBuild } from '../process-create-ticket-build';
import { sendTicketBuildError } from './send-ticket-build-error';

/**
 * Handles POST /api/data/ticket-builds { ops_ticket_id, software_system_id? }.
 * Responds 202 with the planning build (or the ticket's active build); poll GET /:id.
 */
export const postCreateTicketBuildHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const opsTicketId = typeof body.ops_ticket_id === 'string' ? body.ops_ticket_id.trim() : '';
  const softwareSystemId = typeof body.software_system_id === 'string' && body.software_system_id.trim() ? body.software_system_id.trim() : null;
  if (!opsTicketId) {
    res.status(400).json({ success: false, error: 'ops_ticket_id is required' });
    return;
  }
  console.log('📥 POST /api/data/ticket-builds', { ops_ticket_id: opsTicketId, software_system_id: softwareSystemId });
  try {
    const build = await processCreateTicketBuild(client, { opsTicketId, softwareSystemId });
    res.status(202).json({ success: true, data: build });
  } catch (error) {
    sendTicketBuildError(res, 'Error in POST /api/data/ticket-builds', error);
  }
};
