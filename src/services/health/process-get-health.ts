import { getManagedStorageClient } from '../storage-client';
import { probeStorage } from './probe-storage';

export type HealthReport = {
  status: 'ok' | 'degraded';
  message: string;
  storage: 'ok' | 'unconfigured' | 'error';
  storageUrl: string | null;
  database: 'ok' | 'unconfigured' | 'error';
  timestamp: string;
  environment: string;
};

/**
 * Builds the health report (liveness); storage state comes from probeStorage.
 */
export const processGetHealth = async (): Promise<HealthReport> => {
  const storageClient = getManagedStorageClient();
  const probe = await probeStorage();

  return {
    status: probe.storage === 'ok' && probe.database === 'ok' ? 'ok' : 'degraded',
    message: 'Code Control Express Server is running',
    storage: probe.storage,
    storageUrl: storageClient?.baseUrl ?? null,
    database: probe.database,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };
};
