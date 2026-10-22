import type { Response } from 'express';
import { getManagedStorageClient, type StorageClient } from '../../services/storage-client';

/**
 * Returns the managed Storage Express client or sends 500 when unavailable.
 */
export const requireStorageClient = (res: Response): StorageClient | null => {
  const storage = getManagedStorageClient();
  if (!storage) {
    console.error('❌ Storage Express client unavailable');
    res.status(500).json({
      success: false,
      error: 'Storage Express not configured (set STORAGE_EXPRESS_URL and STORAGE_EXPRESS_SECRET)',
    });
    return null;
  }
  return storage;
};
