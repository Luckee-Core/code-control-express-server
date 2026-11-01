import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processDeleteSoftwareSystem } from '../process-delete-software-system';

/**
 * Handles DELETE /api/data/software-systems/:id.
 */
export const deleteSoftwareSystemHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid customer project ID' });
    return;
  }

  console.log('📥 DELETE /api/data/software-systems/:id', { id });
  try {
    await processDeleteSoftwareSystem(client, id);
    res.status(200).json({ success: true });
  } catch (error) {
    logHandlerError('Error in DELETE /api/data/software-systems/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
