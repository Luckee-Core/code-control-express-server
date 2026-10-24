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
      error:
        'Canonical data not configured (direct: CODE_CONTROL_STORAGE_URL + CODE_CONTROL_STORAGE_SECRET; gateway: MAIN_GATEWAY_URL + DISPATCHER_GATE_SECRET)',
    });
    return null;
  }
  return storage;
};
