import { buildOpsTrackerGatewayUrl } from './build-ops-tracker-gateway-url';
import { fetchOpsTrackerGatewayEnvelope } from './fetch-ops-tracker-gateway-envelope';
import type { OpsTrackerGatewayConfig, OpsTrackerRequestResult } from './types';

const INVOKE_PATH = '/api/storage/v1/invoke';

/**
 * POST my-ops storage invoke for CRM reads and writes.
 */
export const requestOpsTrackerInvoke = async <T>(
  config: OpsTrackerGatewayConfig,
  operation: string,
  args: unknown[],
): Promise<OpsTrackerRequestResult<T>> => {
  const url = buildOpsTrackerGatewayUrl(config, INVOKE_PATH);
  console.log(`📥 CRM gateway invoke ${operation}`);
  const result = await fetchOpsTrackerGatewayEnvelope<T>(config, url, {
    method: 'POST',
    body: { operation, args },
  });
  if (!result.ok) {
    console.error(`❌ CRM gateway invoke failed: ${result.error}`);
    return {
      success: false,
      error: result.error,
      status: mapGatewayHttpStatus(result.httpStatus),
    };
  }
  console.log(`📤 CRM gateway invoke ${operation} ok`);
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
