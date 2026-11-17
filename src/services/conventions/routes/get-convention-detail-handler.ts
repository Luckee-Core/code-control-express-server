import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processGetConventionDetail } from '../process-get-convention-detail';

/**
 * Handles GET /api/data/conventions/:id (convention + roles + examples + sources).
 */
export const getConventionDetailHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing id' });
    return;
  }
  try {
    const detail = await processGetConventionDetail(client, id);
    if (!detail) {
      res.status(404).json({ success: false, error: 'Convention not found' });
      return;
    }
    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    sendHandlerError(res, 'Error in GET /api/data/conventions/:id', error);
  }
};
