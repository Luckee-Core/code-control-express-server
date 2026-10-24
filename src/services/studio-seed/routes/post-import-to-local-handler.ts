import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { processImportSeedToLocal } from '../process-import-seed-to-local';

/**
 * Handles POST /api/studio-seed/import-to-local.
 */
export const postImportToLocalHandler = async (_req: Request, res: Response): Promise<void> => {
  console.log('📥 POST /api/studio-seed/import-to-local');
  try {
    const data = await processImportSeedToLocal();
    console.log('📤 200 POST /api/studio-seed/import-to-local', data.tableRowCounts);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logHandlerError('POST /api/studio-seed/import-to-local', error);
    const message = error instanceof Error ? error.message : 'Import failed';
    const status = message.includes('must be different') || message.includes('required') ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
};
