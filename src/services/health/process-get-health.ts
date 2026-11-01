import { getManagedCanonicalDataClient } from '../canonical-data-client';
import { probeCanonicalData } from './probe-canonical-data';
import {
  describeOpsTrackerGatewayConfigGap,
  isOpsTrackerGatewayConfigured,
  requestOpsTracker,
} from '../ops-tracker-client';

export type HealthReport = {
  status: 'ok' | 'degraded';
  message: string;
  canonicalData: 'ok' | 'unconfigured' | 'error';
  canonicalDataDetail: string | null;
  gatewayUrl: string | null;
  gatewayProjectId: string | null;
  directUrl: string | null;
  database: 'ok' | 'unconfigured' | 'error';
  opsTrackerCrm: 'ok' | 'unconfigured' | 'error';
  opsTrackerCrmDetail: string | null;
  timestamp: string;
  environment: string;
};

const probeOpsTrackerCrm = async (): Promise<{
  opsTrackerCrm: HealthReport['opsTrackerCrm'];
  opsTrackerCrmDetail: string | null;
}> => {
  if (!isOpsTrackerGatewayConfigured()) {
    return {
      opsTrackerCrm: 'unconfigured',
      opsTrackerCrmDetail: describeOpsTrackerGatewayConfigGap(),
    };
  }
  const result = await requestOpsTracker<unknown[]>('/customers');
  if (!result.success) {
    return { opsTrackerCrm: 'error', opsTrackerCrmDetail: result.error };
  }
  return { opsTrackerCrm: 'ok', opsTrackerCrmDetail: null };
};

/**
 * Builds the health report (liveness); dependency state from probeCanonicalData.
 */
export const processGetHealth = async (): Promise<HealthReport> => {
  console.log('🔍 [health.processGetHealth] Probing canonical data…');
  const client = getManagedCanonicalDataClient();
  const probe = await probeCanonicalData();
  const crmProbe = await probeOpsTrackerCrm();

  const canonicalOk = probe.canonicalData === 'ok';
  const dbOk = probe.database === 'ok' || probe.database === 'unconfigured';
  const crmOk = crmProbe.opsTrackerCrm === 'ok' || crmProbe.opsTrackerCrm === 'unconfigured';
  const status = canonicalOk && dbOk && crmOk ? 'ok' : 'degraded';

  const report: HealthReport = {
    status,
    message: 'Code Control Express Server is running',
    canonicalData: probe.canonicalData,
    canonicalDataDetail: probe.detail,
    gatewayUrl: client?.accessMode === 'gateway' ? client.gatewayUrl : null,
    gatewayProjectId: client?.accessMode === 'gateway' ? client.gatewayProjectId : null,
    directUrl: client?.accessMode === 'direct' ? client.directUrl : null,
    database: probe.database,
    opsTrackerCrm: crmProbe.opsTrackerCrm,
    opsTrackerCrmDetail: crmProbe.opsTrackerCrmDetail,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  if (status === 'ok') {
    console.log('✅ [health.processGetHealth] Stack healthy', {
      canonicalData: report.canonicalData,
      database: report.database,
      directUrl: report.directUrl,
      gatewayUrl: report.gatewayUrl,
    });
  } else {
    console.warn('⚠️ [health.processGetHealth] Stack degraded', {
      canonicalData: report.canonicalData,
      database: report.database,
      directUrl: report.directUrl,
      gatewayUrl: report.gatewayUrl,
      detail: report.canonicalDataDetail,
    });
  }

  return report;
};
