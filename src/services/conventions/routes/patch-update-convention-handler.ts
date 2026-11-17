import type { Request, Response } from 'express';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processUpdateConvention } from '../process-update-convention';
import { readRoleKeys, validateUpdateConvention } from '../validate-convention-input';

/**
 * Handles PATCH /api/data/conventions/:id (fields and/or role_keys).
 */
export const patchUpdateConventionHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = readRouteParam(req, 'id');
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing id' });
    return;
  }
  const input = validateUpdateConvention(req.body);
  const roleKeys = readRoleKeys(req.body);
  if (!input.ok || !roleKeys.ok) {
    res.status(400).json({ success: false, error: !input.ok ? input.error : (roleKeys as { error: string }).error });
    return;
  }

  console.log('📥 PATCH /api/data/conventions/:id', { id });
  try {
    const detail = await processUpdateConvention(client, id, input.value, roleKeys.value);
    if (!detail) {
      res.status(404).json({ success: false, error: 'Convention not found' });
      return;
    }
    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    sendHandlerError(res, 'Error in PATCH /api/data/conventions/:id', error);
  }
};
