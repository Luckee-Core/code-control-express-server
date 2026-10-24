import type { CanonicalDataAccessMode } from './types';

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

/**
 * Gateway catalog project id for `/{projectId}/api/...` routes (required in gateway mode).
 */
export const readGatewayProjectId = (): string | null => {
  const id = process.env.MAIN_GATEWAY_PROJECT_ID?.trim();
  return id || null;
};

/** Studio co-located direct backend (default :3080). */
export const readDirectBackendUrl = (): string | null => {
  const url =
    process.env.CODE_CONTROL_DIRECT_URL?.trim() || process.env.CODE_CONTROL_STORAGE_URL?.trim();
  return url ? normalizeBaseUrl(url) : null;
};

export const readDirectBackendSecret = (): string | null => {
  const secret =
    process.env.CODE_CONTROL_DIRECT_SECRET?.trim() ||
    process.env.CODE_CONTROL_STORAGE_SECRET?.trim();
  return secret || null;
};

export const readDispatcherGateSecret = (): string | null => {
  const secret = process.env.DISPATCHER_GATE_SECRET?.trim();
  return secret || null;
};

export const readCanonicalDataAccessMode = (): CanonicalDataAccessMode => {
  const raw =
    process.env.CANONICAL_DATA_ACCESS_MODE?.trim().toLowerCase() ||
    process.env.STORAGE_ACCESS_MODE?.trim().toLowerCase();
  if (raw === 'gateway' || raw === 'direct') {
    return raw;
  }
  if (readMainGatewayUrl() && readGatewayProjectId() && readDispatcherGateSecret()) {
    return 'gateway';
  }
  return 'direct';
};

export const describeCanonicalDataConfigGap = (): string | null => {
  const mode = readCanonicalDataAccessMode();
  if (mode === 'gateway') {
    const missing: string[] = [];
    if (!readMainGatewayUrl()) missing.push('MAIN_GATEWAY_URL');
    if (!readGatewayProjectId()) missing.push('MAIN_GATEWAY_PROJECT_ID');
    if (!readDispatcherGateSecret()) missing.push('DISPATCHER_GATE_SECRET');
    if (missing.length > 0) {
      return `Gateway mode — set ${missing.join(', ')} in code-control-express-server/.env`;
    }
    return null;
  }
  const missing: string[] = [];
  if (!readDirectBackendUrl()) missing.push('CODE_CONTROL_DIRECT_URL');
  if (!readDirectBackendSecret()) missing.push('CODE_CONTROL_DIRECT_SECRET');
  if (missing.length > 0) {
    return `Direct mode — set ${missing.join(', ')} in code-control-express-server/.env (or use gateway vars and remove STORAGE_ACCESS_MODE=direct)`;
  }
  return null;
};

export const isCanonicalDataClientConfigured = (): boolean => !describeCanonicalDataConfigGap();

export const readCanonicalDataRequestSecret = (): string | null => {
  if (readCanonicalDataAccessMode() === 'gateway') {
    return null;
  }
  return readDirectBackendSecret();
};

export const readCanonicalDataRequestTimeoutMs = (): number => {
  const parsed = Number(
    process.env.CANONICAL_DATA_REQUEST_TIMEOUT_MS?.trim() ||
      process.env.STORAGE_REQUEST_TIMEOUT_MS?.trim() ||
      10_000,
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
};
