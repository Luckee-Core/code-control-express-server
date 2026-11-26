import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processContinueSystemBuildRun } from '../process-continue-system-build-run';
import { sendSystemBuildError } from './send-system-build-error';

/**
 * Handles POST /api/data/system-build-runs/:id/continue: resumes a paused or failed run. Responds 202.
 */
export const postContinueSystemBuildRunHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  console.log('📥 POST /api/data/system-build-runs/:id/continue', { id: req.params.id });
  try {
    const data = await processContinueSystemBuildRun(client, String(req.params.id));
    res.status(202).json({ success: true, data });
  } catch (error) {
    sendSystemBuildError(res, 'Error in POST /api/data/system-build-runs/:id/continue', error);
  }
};
