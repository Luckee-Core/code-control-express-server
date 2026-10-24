import { readCanonicalDataRequestSecret, requestStorageAtUrl } from '../storage-client';
import type { SeedExportPayload, TempImportResult } from '../temp-migration/types';

const REPLACE_CONFIRM = 'REPLACE_STUDIO_CODE_CONTROL';

const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

/**
 * Exports seed tables from source storage and replaces target storage tables (one transaction on target).
 */
export const processImportSeedBetweenStorages = async (
  sourceUrl: string,
  targetUrl: string,
): Promise<TempImportResult> => {
  const secret = readCanonicalDataRequestSecret();
  if (!secret) {
    throw new Error('CODE_CONTROL_STORAGE_SECRET is required for direct storage import');
  }
  const from = normalizeUrl(sourceUrl);
  const to = normalizeUrl(targetUrl);
  if (!from || !to) {
    throw new Error('Source and target storage URLs are required');
  }
  if (from === to) {
    throw new Error('Source and target storage URLs must be different');
  }

  console.log(`📥 [storage-seed-import] Exporting seed from ${from}`);
  const exportPayload = await requestStorageAtUrl<SeedExportPayload>(from, '/api/storage/seed/export', {
    method: 'POST',
    secret,
    timeoutMs: 120_000,
  });

  console.log(`💾 [storage-seed-import] Importing seed into ${to}`);
  const importResult = await requestStorageAtUrl<{
    importedAt: string;
    tableRowCounts: Record<string, number>;
  }>(to, '/api/storage/seed/import', {
    method: 'POST',
    secret,
    body: { ...exportPayload, confirm: REPLACE_CONFIRM },
    timeoutMs: 120_000,
  });

  return {
    exportedAt: exportPayload.exportedAt,
    importedAt: importResult.importedAt,
    tableRowCounts: importResult.tableRowCounts,
  };
};
