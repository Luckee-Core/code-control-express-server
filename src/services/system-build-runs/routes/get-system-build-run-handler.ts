import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetSystemBuildRun } from '../process-get-system-build-run';
import { sendSystemBuildError } from './send-system-build-error';

/**
 * Handles GET /api/data/system-build-runs/:id: the run, its steps and its log (polling target).
 */
export const getSystemBuildRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  try {
    const data = await processGetSystemBuildRun(client, String(req.params.id));
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendSystemBuildError(res, 'Error in GET /api/data/system-build-runs/:id', error);
  }
};
