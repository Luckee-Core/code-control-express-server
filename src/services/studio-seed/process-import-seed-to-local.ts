import { getManagedCanonicalDataClient } from '../canonical-data-client';
import { processImportSeedBetweenUrls } from './process-import-seed-between-urls';
import type { TempImportResult } from '../temp-migration/types';

const DEFAULT_LOCAL_TARGET = 'http://127.0.0.1:3080';

const resolveSourceOrigin = (
  client: NonNullable<ReturnType<typeof getManagedCanonicalDataClient>>,
): string => {
  if (client.accessMode === 'gateway') {
    return `${client.gatewayUrl}/${client.gatewayProjectId}`;
  }
  return client.directUrl!;
};

/**
 * Copies customers / projects / repos from the configured remote into studio-local backend.
 */
export const processImportSeedToLocal = async (): Promise<TempImportResult> => {
  const client = getManagedCanonicalDataClient();
  const targetUrl = process.env.SEED_IMPORT_TARGET_URL?.trim() || DEFAULT_LOCAL_TARGET;

  if (!client) {
    throw new Error(
      'Canonical data client not configured (gateway or CODE_CONTROL_DIRECT_URL required)',
    );
  }

  return processImportSeedBetweenUrls(resolveSourceOrigin(client), targetUrl);
};
