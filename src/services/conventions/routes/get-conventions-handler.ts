import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processListConventions } from '../process-list-conventions';
import { readListConventionsFilter } from '../validate-convention-input';

/**
 * Handles GET /api/data/conventions (?domain_key&topic_key&role_key&status&severity).
 */
export const getConventionsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const filter = readListConventionsFilter(req.query as Record<string, unknown>);
  if (!filter.ok) {
    res.status(400).json({ success: false, error: filter.error });
    return;
  }

  try {
    const conventions = await processListConventions(client, filter.value);
    res.status(200).json({ success: true, data: conventions, count: conventions.length });
  } catch (error) {
    sendHandlerError(res, 'Error in GET /api/data/conventions', error);
  }
};
