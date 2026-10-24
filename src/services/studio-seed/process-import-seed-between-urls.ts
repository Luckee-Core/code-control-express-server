import { readCanonicalDataRequestSecret, requestAtAbsoluteUrl } from '../canonical-data-client';
import type { SeedExportPayload, TempImportResult } from '../temp-migration/types';

const REPLACE_CONFIRM = 'REPLACE_STUDIO_CODE_CONTROL';

const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

/**
 * Exports seed tables from source backend and replaces target tables (studio-only direct secret).
 */
export const processImportSeedBetweenUrls = async (
  sourceUrl: string,
  targetUrl: string,
): Promise<TempImportResult> => {
  const secret = readCanonicalDataRequestSecret();
  if (!secret) {
    throw new Error('CODE_CONTROL_DIRECT_SECRET is required for seed import');
  }
  const from = normalizeUrl(sourceUrl);
  const to = normalizeUrl(targetUrl);
  if (!from || !to) {
    throw new Error('Source and target URLs are required');
  }
  if (from === to) {
    throw new Error('Source and target URLs must be different');
  }

  console.log(`📥 [studio-seed] Exporting seed from ${from}`);
  const exportPayload = await requestAtAbsoluteUrl<SeedExportPayload>(from, '/api/storage/seed/export', {
    method: 'POST',
    secret,
    timeoutMs: 120_000,
  });

  console.log(`💾 [studio-seed] Importing seed into ${to}`);
  const importResult = await requestAtAbsoluteUrl<{
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
