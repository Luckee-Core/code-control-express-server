import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processApproveDataModelProposal } from '../process-approve-data-model-proposal';
import { sendProposalError } from './send-proposal-error';

/**
 * Handles POST /api/data/data-model-proposals/:id/approve.
 */
export const postApproveDataModelProposalHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing id' });
    return;
  }
  console.log('📥 POST /api/data/data-model-proposals/:id/approve', { id });
  try {
    const proposal = await processApproveDataModelProposal(client, id);
    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    sendProposalError(res, 'Error in POST /api/data/data-model-proposals/:id/approve', error);
  }
};
