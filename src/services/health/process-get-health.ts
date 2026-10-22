import { getManagedStorageClient, requestStorageAtUrl } from '../storage-client';

type ComponentStatus = 'ok' | 'unconfigured' | 'error';

export type HealthReport = {
  status: 'ok' | 'degraded';
  message: string;
  storage: ComponentStatus;
  storageUrl: string | null;
  database: ComponentStatus;
  timestamp: string;
  environment: string;
};

/**
 * Checks Storage Express reachability and the canonical Postgres status it reports.
 */
export const processGetHealth = async (): Promise<HealthReport> => {
  const storageClient = getManagedStorageClient();
  let storage: ComponentStatus = 'unconfigured';
  let database: ComponentStatus = 'unconfigured';

  if (storageClient) {
    try {
      const data = await requestStorageAtUrl<{ database?: ComponentStatus }>(
        storageClient.baseUrl,
        '/api/storage/health',
      );
      storage = 'ok';
      database = data.database ?? 'error';
    } catch (error) {
      console.error('❌ Storage Express health check failed:', error);
      storage = 'error';
      database = 'error';
    }
  }

  return {
    status: storage === 'ok' && database === 'ok' ? 'ok' : 'degraded',
    message: 'Code Control Express Server is running',
    storage,
    storageUrl: storageClient?.baseUrl ?? null,
    database,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };
};
