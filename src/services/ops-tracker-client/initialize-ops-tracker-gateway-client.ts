import {
  describeOpsTrackerGatewayConfigGap,
  isOpsTrackerGatewayConfigured,
  readOpsTrackerGatewayConfig,
  readOpsTrackerGatewayProjectId,
} from './config';

/**
 * Logs CRM gateway readiness at startup (main gate + my-ops project id).
 */
export const initializeOpsTrackerGatewayClient = (): void => {
  console.log('🚀 Initializing ops-tracker CRM gateway client');
  if (!isOpsTrackerGatewayConfigured()) {
    console.error(
      `❌ Ops-tracker CRM gateway not configured. ${describeOpsTrackerGatewayConfigGap() ?? 'Unknown config error.'}`,
    );
    return;
  }
  const config = readOpsTrackerGatewayConfig();
  if (!config) {
    return;
  }
  console.log(
    `✅ CRM via main gateway project="${readOpsTrackerGatewayProjectId()}" → ${config.gatewayUrl}`,
  );
};
