import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCancelSystemBuildRun } from '../process-cancel-system-build-run';
import { sendSystemBuildError } from './send-system-build-error';

/**
 * Handles POST /api/data/system-build-runs/:id/cancel: stops the run after the step in progress.
 */
export const postCancelSystemBuildRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  console.log('📥 POST /api/data/system-build-runs/:id/cancel', { id: req.params.id });
  try {
    const data = await processCancelSystemBuildRun(client, String(req.params.id));
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendSystemBuildError(res, 'Error in POST /api/data/system-build-runs/:id/cancel', error);
  }
};
