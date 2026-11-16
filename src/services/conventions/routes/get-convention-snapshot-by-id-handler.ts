import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetConventionSnapshot } from '../process-get-convention-snapshot';

/**
 * Handles GET /api/data/conventions/snapshots/:snapshotId.
 */
export const getConventionSnapshotByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const snapshotId = req.params.snapshotId;
  if (!snapshotId || Array.isArray(snapshotId)) {
    res.status(400).json({ success: false, error: 'Invalid snapshot ID' });
    return;
  }

  try {
    const snapshot = await processGetConventionSnapshot(client, snapshotId);
    if (!snapshot) {
      res.status(404).json({ success: false, error: 'Snapshot not found' });
      return;
    }
    res.status(200).json({ success: true, data: snapshot });
  } catch (error) {
    logHandlerError('Error in GET /api/data/conventions/snapshots/:snapshotId', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
