import { buildOpsTrackerGatewayUrl } from './build-ops-tracker-gateway-url';
import { fetchOpsTrackerGatewayEnvelope } from './fetch-ops-tracker-gateway-envelope';
import type { OpsTrackerGatewayConfig, OpsTrackerRequestResult } from './types';

/**
 * GET gate-exposed my-ops storage list route (customers, projects).
 */
export const requestOpsTrackerStorageGet = async <T>(
  config: OpsTrackerGatewayConfig,
  storagePath: string,
): Promise<OpsTrackerRequestResult<T>> => {
  const url = buildOpsTrackerGatewayUrl(config, storagePath);
  console.log(`📥 CRM gateway GET ${storagePath}`);
  const result = await fetchOpsTrackerGatewayEnvelope<T>(config, url, { method: 'GET' });
  if (!result.ok) {
    console.error(`❌ CRM gateway GET failed: ${result.error}`);
    return {
      success: false,
      error: result.error,
      status: mapGatewayHttpStatus(result.httpStatus),
    };
  }
  console.log(`📤 CRM gateway GET ${storagePath} ok`);
  return { success: true, data: result.data };
};

const mapGatewayHttpStatus = (httpStatus: number): number => {
  if (httpStatus === 401 || httpStatus === 404 || httpStatus === 503) {
    return 502;
  }
  if (httpStatus >= 500) {
    return 502;
  }
  return httpStatus >= 400 ? httpStatus : 502;
};
