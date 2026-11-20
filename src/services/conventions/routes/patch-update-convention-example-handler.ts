import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processUpdateConventionExample } from '../process-convention-examples';
import { validateUpdateConventionExample } from '../validate-convention-input';
import { readChangeContext } from '../read-change-context';

/**
 * Handles PATCH /api/data/conventions/examples/:exampleId.
 */
export const patchUpdateConventionExampleHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const exampleId = readRouteParam(req, 'exampleId');
  if (!exampleId) {
    res.status(400).json({ success: false, error: 'Missing exampleId' });
    return;
  }

  const input = validateUpdateConventionExample(req.body);
  if (!input.ok) {
    res.status(400).json({ success: false, error: input.error });
    return;
  }

  try {
    const example = await processUpdateConventionExample(client, exampleId, input.value, readChangeContext(req));
    res.status(200).json({ success: true, data: example });
  } catch (error) {
    sendHandlerError(res, 'Error in PATCH /api/data/conventions/examples/:exampleId', error);
  }
};
