import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetDataModelProposal } from '../process-get-data-model-proposal';
import { sendProposalError } from './send-proposal-error';

/**
 * Handles GET /api/data/data-model-proposals/:id (proposal + AI call summaries).
 */
export const getDataModelProposalHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing id' });
    return;
  }
  try {
    const detail = await processGetDataModelProposal(client, id);
    if (!detail) {
      res.status(404).json({ success: false, error: 'Proposal not found' });
      return;
    }
    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    sendProposalError(res, 'Error in GET /api/data/data-model-proposals/:id', error);
  }
};
