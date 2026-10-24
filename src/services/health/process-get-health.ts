import { getManagedCanonicalDataClient } from '../canonical-data-client';
import { probeCanonicalData } from './probe-canonical-data';

export type HealthReport = {
  status: 'ok' | 'degraded';
  message: string;
  canonicalData: 'ok' | 'unconfigured' | 'error';
  gatewayUrl: string | null;
  gatewayProjectId: string | null;
  directUrl: string | null;
  database: 'ok' | 'unconfigured' | 'error';
  timestamp: string;
  environment: string;
};

/**
 * Builds the health report (liveness); dependency state from probeCanonicalData.
 */
export const processGetHealth = async (): Promise<HealthReport> => {
  const client = getManagedCanonicalDataClient();
  const probe = await probeCanonicalData();

  const canonicalOk = probe.canonicalData === 'ok';
  const dbOk = probe.database === 'ok' || probe.database === 'unconfigured';

  return {
    status: canonicalOk && dbOk ? 'ok' : 'degraded',
    message: 'Code Control Express Server is running',
    canonicalData: probe.canonicalData,
    gatewayUrl: client?.accessMode === 'gateway' ? client.gatewayUrl : null,
    gatewayProjectId: client?.accessMode === 'gateway' ? client.gatewayProjectId : null,
    directUrl: client?.accessMode === 'direct' ? client.directUrl : null,
    database: probe.database,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };
};
