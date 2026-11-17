import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processGetConventionsContext } from '../process-get-conventions-context';

/**
 * Handles GET /api/data/conventions/context?domain=data_model&role=storage
 * (rendered AI context of active conventions).
 */
export const getConventionsContextHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const domainKey = typeof req.query.domain === 'string' ? req.query.domain.trim() : '';
  const roleKey = typeof req.query.role === 'string' && req.query.role.trim() ? req.query.role.trim() : null;
  if (!domainKey) {
    res.status(400).json({ success: false, error: 'domain is required' });
    return;
  }

  console.log('📥 GET /api/data/conventions/context', { domainKey, roleKey });
  try {
    const context = await processGetConventionsContext(client, { domainKey, roleKey });
    res.status(200).json({ success: true, data: context });
  } catch (error) {
    sendHandlerError(res, 'Error in GET /api/data/conventions/context', error);
  }
};
