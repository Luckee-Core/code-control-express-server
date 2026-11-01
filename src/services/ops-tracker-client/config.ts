import type { OpsTrackerGatewayConfig } from './types';

const normalizeBaseUrl = (url: string): string => url.replace(/\/$/, '');

/**
 * Main on-device-dispatcher origin (`http://host:3010`) — no project segment.
 */
export const readMainGatewayUrl = (): string | null => {
  const url = process.env.MAIN_GATEWAY_URL?.trim();
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    return normalizeBaseUrl(`${parsed.protocol}//${parsed.host}`);
  } catch {
    return normalizeBaseUrl(url);
  }
};

export const readDispatcherGateSecret = (): string | null => {
  const secret = process.env.DISPATCHER_GATE_SECRET?.trim();
  return secret || null;
};

/**
 * Gateway catalog project id for my-ops CRM (`my-ops-tracker`).
 */
export const readOpsTrackerGatewayProjectId = (): string => {
  const id = process.env.OPS_TRACKER_GATEWAY_PROJECT_ID?.trim();
  return id || 'my-ops-tracker';
};

export const readOpsTrackerRequestTimeoutMs = (): number => {
  const parsed = Number(
    process.env.OPS_TRACKER_REQUEST_TIMEOUT_MS?.trim() ||
      process.env.CANONICAL_DATA_REQUEST_TIMEOUT_MS?.trim() ||
      process.env.STORAGE_REQUEST_TIMEOUT_MS?.trim() ||
      10_000,
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
};

export const describeOpsTrackerGatewayConfigGap = (): string | null => {
  const missing: string[] = [];
  if (!readMainGatewayUrl()) missing.push('MAIN_GATEWAY_URL');
  if (!readDispatcherGateSecret()) missing.push('DISPATCHER_GATE_SECRET');
  if (missing.length > 0) {
    return `CRM gateway — set ${missing.join(', ')} in code-control-express-server/.env`;
  }
  return null;
};

export const isOpsTrackerGatewayConfigured = (): boolean => {
  return Boolean(readMainGatewayUrl() && readDispatcherGateSecret());
};

/**
 * Resolved config for my-ops CRM gateway calls.
 */
export const readOpsTrackerGatewayConfig = (): OpsTrackerGatewayConfig | null => {
  const gatewayUrl = readMainGatewayUrl();
  const gateSecret = readDispatcherGateSecret();
  if (!gatewayUrl || !gateSecret) {
    return null;
  }
  return {
    gatewayUrl,
    gatewayProjectId: readOpsTrackerGatewayProjectId(),
    gateSecret,
  };
};
