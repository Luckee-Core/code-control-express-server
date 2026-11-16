import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processDeleteConvention } from '../process-delete-convention';

/**
 * Handles DELETE /api/data/conventions/:id.
 */
export const deleteConventionHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid convention ID' });
    return;
  }

  console.log('📥 DELETE /api/data/conventions/:id', { id });
  try {
    const result = await processDeleteConvention(client, id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logHandlerError('Error in DELETE /api/data/conventions/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
