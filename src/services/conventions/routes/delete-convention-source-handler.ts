import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processDeleteConventionSource } from '../process-convention-sources';

/**
 * Handles DELETE /api/data/conventions/sources/:sourceId.
 */
export const deleteConventionSourceHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const sourceId = readRouteParam(req, 'sourceId');
  if (!sourceId) {
    res.status(400).json({ success: false, error: 'Missing sourceId' });
    return;
  }
  try {
    const deleted = await processDeleteConventionSource(client, sourceId);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Source not found' });
      return;
    }
    res.status(200).json({ success: true, data: { id: sourceId } });
  } catch (error) {
    sendHandlerError(res, 'Error in DELETE /api/data/conventions/sources/:sourceId', error);
  }
};
