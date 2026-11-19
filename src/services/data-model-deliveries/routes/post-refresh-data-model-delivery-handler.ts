import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendProposalError } from '../../data-model-proposals/routes/send-proposal-error';
import { processRefreshDataModelDelivery } from '../process-refresh-data-model-delivery';

/**
 * Handles POST /api/data/data-model-deliveries/:id/refresh (re-reads the PR state).
 */
export const postRefreshDataModelDeliveryHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Delivery id is required' });
    return;
  }
  try {
    const delivery = await processRefreshDataModelDelivery(client, id);
    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    sendProposalError(res, 'Error in POST /api/data/data-model-deliveries/:id/refresh', error);
  }
};
