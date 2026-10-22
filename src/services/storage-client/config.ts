/**
 * Storage Express base URL (e.g. http://<STUDIO_LAN_IP>:3080), without trailing slash.
 */
export const readStorageExpressUrl = (): string | null => {
  const url = process.env.STORAGE_EXPRESS_URL?.trim();
  return url ? url.replace(/\/$/, '') : null;
};

/**
 * Shared secret for storage HTTP (matches STORAGE_DISPATCHER_SECRET on the storage host).
 */
export const readStorageExpressSecret = (): string | null => {
  const secret = process.env.STORAGE_EXPRESS_SECRET?.trim();
  return secret || null;
};

/**
 * Per-request timeout for storage calls.
 */
export const readStorageRequestTimeoutMs = (): number => {
  const parsed = Number(process.env.STORAGE_REQUEST_TIMEOUT_MS?.trim() || 10_000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
};
