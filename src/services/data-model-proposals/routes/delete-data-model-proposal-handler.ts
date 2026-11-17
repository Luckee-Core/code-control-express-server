import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processDeleteDataModelProposal } from '../process-delete-data-model-proposal';
import { sendProposalError } from './send-proposal-error';

/**
 * Handles DELETE /api/data/data-model-proposals/:id.
 */
export const deleteDataModelProposalHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing id' });
    return;
  }
  try {
    const result = await processDeleteDataModelProposal(client, id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    sendProposalError(res, 'Error in DELETE /api/data/data-model-proposals/:id', error);
  }
};
