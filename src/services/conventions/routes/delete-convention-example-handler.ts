import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processDeleteConventionExample } from '../process-convention-examples';

/**
 * Handles DELETE /api/data/conventions/examples/:exampleId.
 */
export const deleteConventionExampleHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const exampleId = readRouteParam(req, 'exampleId');
  if (!exampleId) {
    res.status(400).json({ success: false, error: 'Missing exampleId' });
    return;
  }
  try {
    const deleted = await processDeleteConventionExample(client, exampleId);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Example not found' });
      return;
    }
    res.status(200).json({ success: true, data: { id: exampleId } });
  } catch (error) {
    sendHandlerError(res, 'Error in DELETE /api/data/conventions/examples/:exampleId', error);
  }
};
