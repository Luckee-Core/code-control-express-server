import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processCreateConvention } from '../process-create-convention';
import { readRoleKeys, validateCreateConvention } from '../validate-convention-input';

/**
 * Handles POST /api/data/conventions.
 */
export const postCreateConventionHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const input = validateCreateConvention(req.body);
  const roleKeys = readRoleKeys(req.body);
  if (!input.ok || !roleKeys.ok) {
    res.status(400).json({ success: false, error: !input.ok ? input.error : (roleKeys as { error: string }).error });
    return;
  }

  console.log('📥 POST /api/data/conventions', { key: input.value.key });
  try {
    const detail = await processCreateConvention(client, input.value, roleKeys.value);
    res.status(201).json({ success: true, data: detail });
  } catch (error) {
    sendHandlerError(res, 'Error in POST /api/data/conventions', error);
  }
};
