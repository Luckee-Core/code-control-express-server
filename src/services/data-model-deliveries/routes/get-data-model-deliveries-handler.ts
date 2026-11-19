import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendProposalError } from '../../data-model-proposals/routes/send-proposal-error';
import { processListDataModelDeliveries } from '../process-list-data-model-deliveries';

/**
 * Handles GET /api/data/data-model-deliveries?proposal_id=
 */
export const getDataModelDeliveriesHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const proposalId = typeof req.query.proposal_id === 'string' ? req.query.proposal_id.trim() : '';
  if (!proposalId) {
    res.status(400).json({ success: false, error: 'proposal_id is required' });
    return;
  }
  try {
    const targets = await processListDataModelDeliveries(client, proposalId);
    res.status(200).json({ success: true, data: targets });
  } catch (error) {
    sendProposalError(res, 'Error in GET /api/data/data-model-deliveries', error);
  }
};
