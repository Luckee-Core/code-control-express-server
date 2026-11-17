import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processCreateConventionSource } from '../process-convention-sources';
import { validateCreateConventionSource } from '../validate-convention-input';

/**
 * Handles POST /api/data/conventions/:id/sources.
 */
export const postCreateConventionSourceHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing id' });
    return;
  }

  const input = validateCreateConventionSource(id, req.body);
  if (!input.ok) {
    res.status(400).json({ success: false, error: input.error });
    return;
  }

  try {
    const source = await processCreateConventionSource(client, input.value);
    if (!source) {
      res.status(404).json({ success: false, error: 'Convention not found' });
      return;
    }
    res.status(201).json({ success: true, data: source });
  } catch (error) {
    sendHandlerError(res, 'Error in POST /api/data/conventions/:id/sources', error);
  }
};
