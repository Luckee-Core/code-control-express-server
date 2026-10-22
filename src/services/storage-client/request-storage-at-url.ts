import { readStorageRequestTimeoutMs } from './config';
import { StorageUnavailableError } from './storage-unavailable-error';
import type { StorageEnvelope } from './types';

/**
 * Calls a Storage Express host and unwraps the `{ success, data }` envelope.
 */
export const requestStorageAtUrl = async <T>(
  baseUrl: string,
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    secret?: string;
    timeoutMs?: number;
  } = {},
): Promise<T> => {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;
  const timeoutMs = options.timeoutMs ?? readStorageRequestTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.secret) {
    headers['x-storage-secret'] = options.secret;
  }

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new StorageUnavailableError(normalizedBase, 'timeout', timeoutMs);
      }
      throw new StorageUnavailableError(normalizedBase, 'unreachable');
    }

    let json: StorageEnvelope<T>;
    try {
      json = (await response.json()) as StorageEnvelope<T>;
    } catch {
      throw new Error(`Storage returned non-JSON response (${response.status}) for ${path}`);
    }
    if (!response.ok || !json.success) {
      throw new Error(json.error ?? `Storage request failed (${response.status})`);
    }
    return json.data as T;
  } finally {
    clearTimeout(timeout);
  }
};
