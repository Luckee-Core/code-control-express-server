import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processUpdateTicketBuildRepo } from '../process-update-ticket-build-repo';
import { sendTicketBuildError } from '../../ticket-builds/routes/send-ticket-build-error';

/**
 * Handles PATCH /api/data/ticket-build-repos/:id { plan_text?, included? } (only while plan_ready).
 */
export const patchTicketBuildRepoHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const planText = typeof body.plan_text === 'string' ? body.plan_text : undefined;
  const included = typeof body.included === 'boolean' ? body.included : undefined;
  if (planText === undefined && included === undefined) {
    res.status(400).json({ success: false, error: 'plan_text or included is required' });
    return;
  }
  console.log('📥 PATCH /api/data/ticket-build-repos/:id', { id: req.params.id, included });
  try {
    const data = await processUpdateTicketBuildRepo(client, String(req.params.id), { planText, included });
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendTicketBuildError(res, 'Error in PATCH /api/data/ticket-build-repos/:id', error);
  }
};
