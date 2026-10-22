import { readStorageExpressSecret, readStorageExpressUrl, requestStorageAtUrl } from '../storage-client';
import type { SeedExportPayload, TempImportResult } from './types';

const REPLACE_CONFIRM = 'REPLACE_STUDIO_CODE_CONTROL';

/**
 * Pulls a seed export from laptop storage and replaces studio storage tables with it.
 */
export const processTempImportFromLaptopStorage = async (): Promise<TempImportResult> => {
  const laptopUrl = process.env.LAPTOP_STORAGE_EXPRESS_URL?.trim();
  const targetUrl = process.env.STORAGE_IMPORT_TARGET_URL?.trim() || readStorageExpressUrl();
  const secret = readStorageExpressSecret();

  if (!laptopUrl || !targetUrl || !secret) {
    throw new Error(
      'LAPTOP_STORAGE_EXPRESS_URL, STORAGE_IMPORT_TARGET_URL (or STORAGE_EXPRESS_URL), and STORAGE_EXPRESS_SECRET are required',
    );
  }
  if (laptopUrl.replace(/\/$/, '') === targetUrl.replace(/\/$/, '')) {
    throw new Error('LAPTOP_STORAGE_EXPRESS_URL and the import target must be different hosts');
  }

  console.log(`📥 [temp-migration] Exporting seed from ${laptopUrl}`);
  const exportPayload = await requestStorageAtUrl<SeedExportPayload>(
    laptopUrl,
    '/api/storage/seed/export',
    { method: 'POST', secret },
  );

  console.log(`💾 [temp-migration] Importing seed into ${targetUrl}`);
  const importResult = await requestStorageAtUrl<{
    importedAt: string;
    tableRowCounts: Record<string, number>;
  }>(targetUrl, '/api/storage/seed/import', {
    method: 'POST',
    secret,
    body: { ...exportPayload, confirm: REPLACE_CONFIRM },
  });

  return {
    exportedAt: exportPayload.exportedAt,
    importedAt: importResult.importedAt,
    tableRowCounts: importResult.tableRowCounts,
  };
};
