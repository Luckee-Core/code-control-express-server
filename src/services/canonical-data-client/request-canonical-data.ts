import { buildCanonicalDataRequestUrl } from './build-canonical-data-request-url';
import { readCanonicalDataRequestTimeoutMs } from './config';
import type { CanonicalDataClient, CanonicalDataEnvelope } from './types';

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  secret?: string | null;
  gateSecret?: string | null;
  timeoutMs?: number;
};

const fetchCanonicalEnvelope = async <T>(url: string, options: RequestOptions): Promise<T> => {
  const timeoutMs = options.timeoutMs ?? readCanonicalDataRequestTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.secret?.trim()) {
    headers['x-storage-secret'] = options.secret.trim();
  }
  if (options.gateSecret) {
    headers['x-dispatcher-gate-secret'] = options.gateSecret;
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
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw error instanceof Error ? error : new Error('Request failed');
    }

    let json: CanonicalDataEnvelope<T>;
    try {
      json = (await response.json()) as CanonicalDataEnvelope<T>;
    } catch {
      throw new Error(`Upstream returned non-JSON (${response.status})`);
    }
    if (!response.ok || !json.success) {
      throw new Error(json.error ?? `Request failed (${response.status})`);
    }
    return json.data as T;
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Calls canonical data using the managed client (gateway project + path, or studio direct).
 */
export const requestWithCanonicalDataClient = async <T>(
  client: CanonicalDataClient,
  path: string,
  options: Omit<RequestOptions, 'secret' | 'gateSecret'> & {
    secret?: string | null;
    gateSecret?: string | null;
  } = {},
): Promise<T> => {
  const url = buildCanonicalDataRequestUrl(client, path);
  return fetchCanonicalEnvelope<T>(url, {
    ...options,
    secret: options.secret ?? client.secret,
    gateSecret: options.gateSecret ?? client.gateSecret,
  });
};

/**
 * Absolute base URL + path (studio seed import between two backends).
 */
export const requestAtAbsoluteUrl = async <T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;
  return fetchCanonicalEnvelope<T>(url, options);
};
