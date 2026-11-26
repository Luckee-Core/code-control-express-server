import type { Request, Response } from 'express';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListSystemBuildRuns } from '../process-list-system-build-runs';
import { sendSystemBuildError } from './send-system-build-error';

/**
 * Handles GET /api/data/system-build-runs?software_system_id=: the system's runs, newest first.
 */
export const getSystemBuildRunsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const softwareSystemId = typeof req.query.software_system_id === 'string' ? req.query.software_system_id.trim() : '';
  if (!softwareSystemId) {
    res.status(400).json({ success: false, error: 'software_system_id is required' });
    return;
  }
  try {
    const data = await processListSystemBuildRuns(client, softwareSystemId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendSystemBuildError(res, 'Error in GET /api/data/system-build-runs', error);
  }
};
