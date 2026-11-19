import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processListSetupPresets } from '../process-list-setup-presets';

/**
 * Handles GET /api/data/setup-presets.
 */
export const getSetupPresetsHandler = async (_req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  try {
    const presets = await processListSetupPresets(client);
    res.status(200).json({ success: true, data: presets });
  } catch (error) {
    sendHandlerError(res, 'Error in GET /api/data/setup-presets', error);
  }
};
