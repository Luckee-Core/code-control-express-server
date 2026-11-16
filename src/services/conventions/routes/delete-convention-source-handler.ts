import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processDeleteConventionSource } from '../process-delete-convention-source';

/**
 * Handles DELETE /api/data/conventions/sources/:sourceId.
 */
export const deleteConventionSourceHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const sourceId = req.params.sourceId;
  if (!sourceId || Array.isArray(sourceId)) {
    res.status(400).json({ success: false, error: 'Invalid source ID' });
    return;
  }

  console.log('📥 DELETE /api/data/conventions/sources/:sourceId', { sourceId });
  try {
    const result = await processDeleteConventionSource(client, sourceId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logHandlerError('Error in DELETE /api/data/conventions/sources/:sourceId', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
