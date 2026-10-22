import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { processTempImportFromLaptopStorage } from '../process-temp-import-from-laptop-storage';

/**
 * Handles POST /api/admin/temp-import-from-laptop-storage.
 */
export const postImportFromLaptopHandler = async (_req: Request, res: Response): Promise<void> => {
  console.log('📥 POST /api/admin/temp-import-from-laptop-storage');
  try {
    const data = await processTempImportFromLaptopStorage();
    console.log('📤 200 POST /api/admin/temp-import-from-laptop-storage', data.tableRowCounts);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logHandlerError('POST /api/admin/temp-import-from-laptop-storage', error);
    const message = error instanceof Error ? error.message : 'Import failed';
    res.status(500).json({ success: false, error: message });
  }
};
