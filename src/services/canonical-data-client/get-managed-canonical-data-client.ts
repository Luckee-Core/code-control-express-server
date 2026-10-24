import {
  describeCanonicalDataConfigGap,
  isCanonicalDataClientConfigured,
  readCanonicalDataRequestSecret,
  readCanonicalDataAccessMode,
  readDirectBackendUrl,
  readDispatcherGateSecret,
  readGatewayProjectId,
  readMainGatewayUrl,
} from './config';
import type { CanonicalDataClient } from './types';

let managedClient: CanonicalDataClient | null = null;

export const getManagedCanonicalDataClient = (): CanonicalDataClient | null => {
  if (managedClient) {
    return managedClient;
  }
  if (!isCanonicalDataClientConfigured()) {
    return null;
  }

  const accessMode = readCanonicalDataAccessMode();
  managedClient = {
    accessMode,
    gatewayUrl: accessMode === 'gateway' ? readMainGatewayUrl() : null,
    gatewayProjectId: accessMode === 'gateway' ? readGatewayProjectId() : null,
    directUrl: accessMode === 'direct' ? readDirectBackendUrl() : null,
    secret: readCanonicalDataRequestSecret(),
    gateSecret: accessMode === 'gateway' ? readDispatcherGateSecret() : null,
  };
  return managedClient;
};

export const initializeManagedCanonicalDataClient = (): void => {
  console.log('🚀 Initializing canonical data client');
  const client = getManagedCanonicalDataClient();
  if (!client) {
    console.error(`❌ Canonical data not configured. ${describeCanonicalDataConfigGap() ?? 'Unknown config error.'}`);
    return;
  }
  if (client.accessMode === 'gateway') {
    console.log(
      `✅ Canonical data via main gateway project="${client.gatewayProjectId}" → ${client.gatewayUrl}`,
    );
    return;
  }
  console.log(`✅ Canonical data via direct backend → ${client.directUrl}`);
};
