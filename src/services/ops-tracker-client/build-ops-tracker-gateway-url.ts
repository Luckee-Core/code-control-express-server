import type { OpsTrackerGatewayConfig } from './types';

/**
 * Builds `{gatewayUrl}/{gatewayProjectId}{childPath}` for my-ops storage routes.
 */
export const buildOpsTrackerGatewayUrl = (
  config: OpsTrackerGatewayConfig,
  childPath: string,
): string => {
  const normalizedPath = childPath.startsWith('/') ? childPath : `/${childPath}`;
  return `${config.gatewayUrl}/${config.gatewayProjectId}${normalizedPath}`;
};
