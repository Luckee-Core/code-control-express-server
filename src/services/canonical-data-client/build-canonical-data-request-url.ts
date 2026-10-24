import type { CanonicalDataClient } from './types';

/**
 * Resolves the HTTP URL for a path on the canonical data plane.
 * Gateway: `/{gatewayProjectId}{path}`; direct: `{directUrl}{path}`.
 */
export const buildCanonicalDataRequestUrl = (
  client: CanonicalDataClient,
  path: string,
): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (client.accessMode === 'gateway') {
    if (!client.gatewayUrl || !client.gatewayProjectId) {
      throw new Error('Gateway client missing MAIN_GATEWAY_URL or MAIN_GATEWAY_PROJECT_ID');
    }
    return `${client.gatewayUrl}/${client.gatewayProjectId}${normalizedPath}`;
  }
  if (!client.directUrl) {
    throw new Error('Direct backend URL is not configured (CODE_CONTROL_STORAGE_URL)');
  }
  return `${client.directUrl}${normalizedPath}`;
};
