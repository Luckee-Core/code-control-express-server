export type StorageAccessMode = 'direct' | 'gateway';

const normalizeBaseUrl = (url: string): string => url.replace(/\/$/, '');

/**
 * Main on-device-dispatcher (`:3010`). Laptop / remote hosts — canonical data via gateway proxy.
 */
export const readMainGatewayUrl = (): string | null => {
  const url = process.env.MAIN_GATEWAY_URL?.trim();
  return url ? normalizeBaseUrl(url) : null;
};

/**
 * Studio direct — `code-generator-storage-server` (`:3080` on loopback or LAN).
 */
export const readCodeControlStorageUrl = (): string | null => {
  const url = process.env.CODE_CONTROL_STORAGE_URL?.trim();
  return url ? normalizeBaseUrl(url) : null;
};

/**
 * Studio direct only — matches storage `STORAGE_DISPATCHER_SECRET`.
 */
export const readCodeControlStorageSecret = (): string | null => {
  const secret = process.env.CODE_CONTROL_STORAGE_SECRET?.trim();
  return secret || null;
};

/**
 * Gateway mode — on-device-dispatcher `DISPATCHER_GATE_SECRET`.
 */
export const readDispatcherGateSecret = (): string | null => {
  const secret = process.env.DISPATCHER_GATE_SECRET?.trim();
  return secret || null;
};

/**
 * `direct`: express → storage :3080. `gateway`: express → main gateway :3010.
 */
export const readStorageAccessMode = (): StorageAccessMode => {
  const raw = process.env.STORAGE_ACCESS_MODE?.trim().toLowerCase();
  if (raw === 'gateway' || raw === 'direct') {
    return raw;
  }
  if (readMainGatewayUrl() || readDispatcherGateSecret()) {
    return 'gateway';
  }
  return 'direct';
};

/**
 * HTTP base URL for canonical data (`/api/storage/*`).
 */
export const resolveCanonicalDataBaseUrl = (): string | null => {
  if (readStorageAccessMode() === 'gateway') {
    return readMainGatewayUrl();
  }
  return readCodeControlStorageUrl();
};

export const isStorageClientConfigured = (): boolean => {
  if (readStorageAccessMode() === 'gateway') {
    return !!readMainGatewayUrl() && !!readDispatcherGateSecret();
  }
  return !!readCodeControlStorageUrl() && !!readCodeControlStorageSecret();
};

/**
 * Secret sent on storage HTTP requests (direct mode only).
 */
export const readCanonicalDataRequestSecret = (): string | null => {
  if (readStorageAccessMode() === 'gateway') {
    return null;
  }
  return readCodeControlStorageSecret();
};

/**
 * Per-request timeout for storage calls.
 */
export const readStorageRequestTimeoutMs = (): number => {
  const parsed = Number(process.env.STORAGE_REQUEST_TIMEOUT_MS?.trim() || 10_000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
};
