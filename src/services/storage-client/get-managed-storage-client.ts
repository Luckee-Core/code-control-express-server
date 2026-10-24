import {
  isStorageClientConfigured,
  readCanonicalDataRequestSecret,
  readDispatcherGateSecret,
  readStorageAccessMode,
  resolveCanonicalDataBaseUrl,
} from './config';
import type { StorageClient } from './types';

let managedStorageClient: StorageClient | null = null;

/**
 * Returns the singleton Storage Express client, or null when env is missing.
 */
export const getManagedStorageClient = (): StorageClient | null => {
  if (managedStorageClient) return managedStorageClient;

  if (!isStorageClientConfigured()) {
    return null;
  }

  const baseUrl = resolveCanonicalDataBaseUrl()!;
  const accessMode = readStorageAccessMode();
  managedStorageClient = {
    baseUrl,
    accessMode,
    secret: readCanonicalDataRequestSecret(),
    gateSecret: accessMode === 'gateway' ? readDispatcherGateSecret() : null,
  };
  return managedStorageClient;
};

/**
 * Initializes the managed Storage Express client at server startup.
 */
export const initializeManagedStorageClient = (): void => {
  console.log('🚀 Initializing managed Storage Express client');
  const storage = getManagedStorageClient();
  if (storage) {
    const via =
      storage.accessMode === 'gateway'
        ? 'main gateway (storage secret injected on studio)'
        : 'Storage Express';
    console.log(`✅ Canonical data via ${via} → ${storage.baseUrl}`);
  } else {
    const legacyUrl = process.env.STORAGE_EXPRESS_URL?.trim();
    const legacySecret = process.env.STORAGE_EXPRESS_SECRET?.trim();
    if (legacyUrl || legacySecret) {
      console.error(
        '❌ STORAGE_EXPRESS_URL / STORAGE_EXPRESS_SECRET are no longer used. Use CODE_CONTROL_STORAGE_* (studio direct) or MAIN_GATEWAY_URL + DISPATCHER_GATE_SECRET (gateway).',
      );
    } else {
      console.error(
        '❌ Canonical data not configured: direct → CODE_CONTROL_STORAGE_URL + CODE_CONTROL_STORAGE_SECRET; gateway → MAIN_GATEWAY_URL + DISPATCHER_GATE_SECRET',
      );
    }
  }
};
