import { resolveCanonicalDataBaseUrl } from '../storage-client';
import { processImportSeedBetweenStorages } from '../storage-seed-import';
import type { TempImportResult } from '../temp-migration/types';

const DEFAULT_LOCAL_TARGET = 'http://127.0.0.1:3080';

/**
 * Copies customers / projects / repos from the configured remote storage into studio-local storage Postgres.
 */
export const processImportSeedToLocalStorage = async (): Promise<TempImportResult> => {
  const sourceUrl = resolveCanonicalDataBaseUrl();
  const targetUrl = process.env.STORAGE_IMPORT_TARGET_URL?.trim() || DEFAULT_LOCAL_TARGET;

  if (!sourceUrl) {
    throw new Error('Canonical data base URL is required (CODE_CONTROL_STORAGE_URL or MAIN_GATEWAY_URL)');
  }

  return processImportSeedBetweenStorages(sourceUrl, targetUrl);
};
