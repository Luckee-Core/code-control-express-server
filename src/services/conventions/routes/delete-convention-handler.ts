import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processDeleteConvention } from '../process-delete-convention';

/**
 * Handles DELETE /api/data/conventions/:id.
 */
export const deleteConventionHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing id' });
    return;
  }
  console.log('📥 DELETE /api/data/conventions/:id', { id });
  try {
    const deleted = await processDeleteConvention(client, id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Convention not found' });
      return;
    }
    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    sendHandlerError(res, 'Error in DELETE /api/data/conventions/:id', error);
  }
};
