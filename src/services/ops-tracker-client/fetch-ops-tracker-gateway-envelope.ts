import { readOpsTrackerRequestTimeoutMs } from './config';
import type { OpsTrackerGatewayConfig, OpsTrackerJsonEnvelope } from './types';

type FetchGatewayOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
};

/**
 * Fetches JSON envelope from main gateway with gate auth.
 */
export const fetchOpsTrackerGatewayEnvelope = async <T>(
  config: OpsTrackerGatewayConfig,
  url: string,
  options: FetchGatewayOptions = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string; httpStatus: number }> => {
  const timeoutMs = options.timeoutMs ?? readOpsTrackerRequestTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-dispatcher-gate-secret': config.gateSecret,
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
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
        return {
          ok: false,
          error: `CRM gateway request timed out after ${timeoutMs}ms`,
          httpStatus: 502,
        };
      }
      const message = error instanceof Error ? error.message : 'CRM gateway request failed';
      return { ok: false, error: message, httpStatus: 502 };
    }

    let json: OpsTrackerJsonEnvelope<T>;
    const rawBody = await response.text();
    if (!rawBody.trim()) {
      if (!response.ok) {
        return {
          ok: false,
          error: `CRM gateway HTTP ${response.status}`,
          httpStatus: response.status >= 400 ? response.status : 502,
        };
      }
      return { ok: true, data: undefined as T };
    }
    try {
      json = JSON.parse(rawBody) as OpsTrackerJsonEnvelope<T>;
    } catch {
      const snippet = rawBody.length > 120 ? `${rawBody.slice(0, 120)}…` : rawBody;
      return {
        ok: false,
        error: snippet.trim() || `CRM gateway returned non-JSON (${response.status})`,
        httpStatus: response.ok ? 502 : response.status,
      };
    }

    if (!response.ok || json.success === false) {
      return {
        ok: false,
        error: json.error ?? `CRM gateway HTTP ${response.status}`,
        httpStatus: response.status >= 400 ? response.status : 502,
      };
    }

    return { ok: true, data: json.data as T };
  } finally {
    clearTimeout(timeout);
  }
};
