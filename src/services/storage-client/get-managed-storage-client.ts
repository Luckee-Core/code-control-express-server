import { readStorageExpressSecret, readStorageExpressUrl } from './config';
import type { StorageClient } from './types';

let managedStorageClient: StorageClient | null = null;

/**
 * Returns the singleton Storage Express client, or null when env is missing.
 */
export const getManagedStorageClient = (): StorageClient | null => {
  if (managedStorageClient) return managedStorageClient;

  const baseUrl = readStorageExpressUrl();
  const secret = readStorageExpressSecret();
  if (!baseUrl || !secret) {
    return null;
  }

  managedStorageClient = { baseUrl, secret };
  return managedStorageClient;
};

/**
 * Initializes the managed Storage Express client at server startup.
 */
export const initializeManagedStorageClient = (): void => {
  console.log('🚀 Initializing managed Storage Express client');
  const storage = getManagedStorageClient();
  if (storage) {
    console.log(`✅ Canonical data via Storage Express → ${storage.baseUrl}`);
  } else {
    console.error('❌ Storage Express not configured (set STORAGE_EXPRESS_URL and STORAGE_EXPRESS_SECRET)');
  }
};
