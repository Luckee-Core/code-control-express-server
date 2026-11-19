import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processUpdateTicketBuild } from '../process-update-ticket-build';
import { sendTicketBuildError } from './send-ticket-build-error';

/**
 * Handles PATCH /api/data/ticket-builds/:id { contract_text } (only while plan_ready).
 */
export const patchTicketBuildHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (typeof body.contract_text !== 'string') {
    res.status(400).json({ success: false, error: 'contract_text is required' });
    return;
  }
  console.log('📥 PATCH /api/data/ticket-builds/:id', { id: req.params.id });
  try {
    const data = await processUpdateTicketBuild(client, String(req.params.id), { contractText: body.contract_text });
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendTicketBuildError(res, 'Error in PATCH /api/data/ticket-builds/:id', error);
  }
};
