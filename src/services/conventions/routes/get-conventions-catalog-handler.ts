import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processGetConventionsCatalog } from '../process-get-conventions-catalog';

/**
 * Handles GET /api/data/conventions/catalog.
 */
export const getConventionsCatalogHandler = async (_req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  try {
    const catalog = await processGetConventionsCatalog(client);
    res.status(200).json({ success: true, data: catalog });
  } catch (error) {
    sendHandlerError(res, 'Error in GET /api/data/conventions/catalog', error);
  }
};
