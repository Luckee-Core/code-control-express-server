import { readDirectBackendUrl } from '../canonical-data-client';
import { processImportSeedBetweenUrls } from '../studio-seed/process-import-seed-between-urls';
import type { TempImportResult } from './types';

/**
 * Pulls a seed export from laptop backend and replaces studio tables with it.
 */
export const processTempImportFromLaptop = async (): Promise<TempImportResult> => {
  const laptopUrl = process.env.TEMP_MIGRATION_LAPTOP_URL?.trim();
  const targetUrl = process.env.SEED_IMPORT_TARGET_URL?.trim() || readDirectBackendUrl();

  if (!laptopUrl) {
    throw new Error('TEMP_MIGRATION_LAPTOP_URL is required');
  }
  if (!targetUrl) {
    throw new Error('SEED_IMPORT_TARGET_URL or CODE_CONTROL_DIRECT_URL is required on studio');
  }

  return processImportSeedBetweenUrls(laptopUrl, targetUrl);
};
