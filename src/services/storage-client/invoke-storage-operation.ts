import { requestStorageAtUrl } from './request-storage-at-url';
import type { StorageClient } from './types';

/**
 * Runs a whitelisted data-layer operation on Storage Express (`POST /api/storage/v1/invoke`).
 */
export const invokeStorageOperation = async <T>(
  storage: StorageClient,
  operation: string,
  args: unknown[] = [],
): Promise<T> =>
  requestStorageAtUrl<T>(storage.baseUrl, '/api/storage/v1/invoke', {
    method: 'POST',
    secret: storage.secret,
    gateSecret: storage.gateSecret,
    body: { operation, args },
  });
