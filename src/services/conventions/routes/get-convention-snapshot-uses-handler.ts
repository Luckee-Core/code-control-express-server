import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListConventionSnapshotUses } from '../process-list-convention-snapshot-uses';

/**
 * Handles GET /api/data/conventions/snapshots/:snapshotId/uses.
 */
export const getConventionSnapshotUsesHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const snapshotId = req.params.snapshotId;
  if (!snapshotId || Array.isArray(snapshotId)) {
    res.status(400).json({ success: false, error: 'Invalid snapshot ID' });
    return;
  }

  try {
    const uses = await processListConventionSnapshotUses(client, snapshotId);
    res.status(200).json({ success: true, data: uses });
  } catch (error) {
    logHandlerError('Error in GET /api/data/conventions/snapshots/:snapshotId/uses', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
