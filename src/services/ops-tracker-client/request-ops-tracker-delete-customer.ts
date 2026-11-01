import { describeOpsTrackerGatewayConfigGap, readOpsTrackerGatewayConfig } from './config';
import { buildOpsTrackerGatewayUrl } from './build-ops-tracker-gateway-url';
import { fetchOpsTrackerGatewayEnvelope } from './fetch-ops-tracker-gateway-envelope';
import { requestOpsTrackerInvoke } from './request-ops-tracker-invoke';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deletes a CRM customer via my-ops Express DELETE /api/data/customers/:id (gateway),
 * falling back to storage invoke when the express route is unavailable.
 */
export const requestOpsTrackerDeleteCustomer = async (
  customerId: string,
): Promise<{ success: true } | { success: false; error: string; status: number }> => {
  if (!UUID_PATTERN.test(customerId)) {
    return { success: false, error: 'Invalid customer id', status: 400 };
  }

  const config = readOpsTrackerGatewayConfig();
  if (!config) {
    const gap = describeOpsTrackerGatewayConfigGap();
    return {
      success: false,
      error: gap ?? 'CRM gateway not configured',
      status: 503,
    };
  }

  const expressUrl = buildOpsTrackerGatewayUrl(config, `/api/data/customers/${customerId}`);
  const expressResult = await fetchOpsTrackerGatewayEnvelope<void>(config, expressUrl, {
    method: 'DELETE',
  });

  if (expressResult.ok) {
    return { success: true };
  }

  const expressStatus = expressResult.httpStatus;
  const tryInvoke =
    expressStatus === 404 ||
    expressStatus === 502 ||
    expressStatus === 503 ||
    expressResult.error.includes('non-JSON') ||
    expressResult.error.startsWith('Internal Server');

  if (!tryInvoke) {
    return {
      success: false,
      error: expressResult.error,
      status: expressStatus >= 400 && expressStatus < 600 ? expressStatus : 502,
    };
  }

  const invokeResult = await requestOpsTrackerInvoke<void>(config, 'deleteCustomer', [customerId]);
  if (!invokeResult.success) {
    return invokeResult;
  }
  return { success: true };
};
