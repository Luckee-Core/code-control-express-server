import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListConventionSnapshots } from '../process-list-convention-snapshots';
import { readQueryString } from './read-query-string';

/**
 * Handles GET /api/data/conventions/snapshots.
 */
export const getConventionSnapshotsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const readStr = (name: string): string | undefined => readQueryString(req, name);
  const filter = {
    ...(readStr('domain_key') && { domain_key: readStr('domain_key') }),
    ...(readStr('role_key') && { role_key: readStr('role_key') }),
  };

  try {
    const snapshots = await processListConventionSnapshots(client, filter);
    res.status(200).json({ success: true, data: snapshots });
  } catch (error) {
    logHandlerError('Error in GET /api/data/conventions/snapshots', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
