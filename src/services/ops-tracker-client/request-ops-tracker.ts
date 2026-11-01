import { describeOpsTrackerGatewayConfigGap, readOpsTrackerGatewayConfig } from './config';
import { parseOpsTrackerCrmPath } from './parse-ops-tracker-crm-path';
import { requestOpsTrackerInvoke } from './request-ops-tracker-invoke';
import { requestOpsTrackerStorageGet } from './request-ops-tracker-storage-get';

/**
 * CRM reads via main gateway → my-ops-tracker storage (lists + invoke).
 */
export const requestOpsTracker = async <T>(
  path: string,
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> => {
  const config = readOpsTrackerGatewayConfig();
  if (!config) {
    const gap = describeOpsTrackerGatewayConfigGap();
    return {
      success: false,
      error: gap ?? 'CRM gateway not configured',
      status: 503,
    };
  }

  const parsed = parseOpsTrackerCrmPath(path);
  if (parsed.kind === 'unsupported') {
    return { success: false, error: parsed.reason, status: 404 };
  }

  switch (parsed.kind) {
    case 'listCustomers': {
      const first = await requestOpsTrackerStorageGet<T>(config, '/api/storage/customers');
      if (first.success || first.status !== 502) {
        return first;
      }
      return requestOpsTrackerStorageGet<T>(config, '/api/storage/customers');
    }
    case 'listProjects': {
      const first = await requestOpsTrackerStorageGet<T>(config, '/api/storage/projects');
      if (first.success || first.status !== 502) {
        return first;
      }
      return requestOpsTrackerStorageGet<T>(config, '/api/storage/projects');
    }
    case 'getProjectById': {
      const result = await requestOpsTrackerInvoke<T | null>(config, 'getProjectById', [parsed.id]);
      if (!result.success) {
        return result;
      }
      if (result.data == null) {
        return { success: false, error: 'Project not found', status: 404 };
      }
      return { success: true, data: result.data as T };
    }
    case 'getCustomerById': {
      const result = await requestOpsTrackerInvoke<T | null>(config, 'getCustomerById', [parsed.id]);
      if (!result.success) {
        return result;
      }
      if (result.data == null) {
        return { success: false, error: 'Customer not found', status: 404 };
      }
      return { success: true, data: result.data as T };
    }
    case 'getCustomerContacts':
      return requestOpsTrackerInvoke<T>(config, 'getCustomerContactsByCustomerId', [parsed.customerId]);
    case 'getUserById': {
      const result = await requestOpsTrackerInvoke<T | null>(config, 'getUserById', [parsed.id]);
      if (!result.success) {
        return result;
      }
      return { success: true, data: result.data as T };
    }
    default: {
      const _exhaustive: never = parsed;
      return _exhaustive;
    }
  }
};
