import { readCodeControlStorageUrl } from '../storage-client';
import { processImportSeedBetweenStorages } from '../storage-seed-import';
import type { TempImportResult } from './types';

/**
 * Pulls a seed export from laptop storage and replaces studio storage tables with it.
 */
export const processTempImportFromLaptopStorage = async (): Promise<TempImportResult> => {
  const laptopUrl = process.env.LAPTOP_CODE_CONTROL_STORAGE_URL?.trim();
  const targetUrl = process.env.STORAGE_IMPORT_TARGET_URL?.trim() || readCodeControlStorageUrl();

  if (!laptopUrl || !targetUrl) {
    throw new Error(
      'LAPTOP_CODE_CONTROL_STORAGE_URL and STORAGE_IMPORT_TARGET_URL (or CODE_CONTROL_STORAGE_URL) are required',
    );
  }

  return processImportSeedBetweenStorages(laptopUrl, targetUrl);
};
