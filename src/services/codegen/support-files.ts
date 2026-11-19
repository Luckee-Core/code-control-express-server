/**
 * Shared plumbing the generated CRUD code imports. Written only when the repo does not have the
 * file yet (never overwritten). Ported from the estimate-and-proposals express/web repos with
 * generic env names.
 */

export type SupportFile = { path: string; content: string };

const EXPRESS_CLIENT_TYPES = `export type CanonicalDataAccessMode = 'direct' | 'gateway';

/** How API express reaches its storage: directly (studio) or through the main gateway. */
export type CanonicalDataClient = {
  accessMode: CanonicalDataAccessMode;
  /** Main gateway origin, e.g. \`http://10.0.0.28:3010\` (gateway mode). */
  gatewayUrl: string | null;
  /** Gateway catalog project id (MAIN_GATEWAY_PROJECT_ID). */
  gatewayProjectId: string | null;
  /** Storage origin in direct mode (STORAGE_URL). */
  directUrl: string | null;
  secret: string | null;
  gateSecret: string | null;
};

export type CanonicalDataEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
`;

const EXPRESS_CLIENT_CONFIG = `import type { CanonicalDataAccessMode } from './types';

const normalizeBaseUrl = (url: string): string => url.replace(/\\/$/, '');

/** Main gateway origin (\`http://host:3010\`), no project segment. */
export const readMainGatewayUrl = (): string | null => {
  const url = process.env.MAIN_GATEWAY_URL?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return normalizeBaseUrl(\`\${parsed.protocol}//\${parsed.host}\`);
  } catch {
    return normalizeBaseUrl(url);
  }
};

/** Gateway catalog project id for \`/{projectId}/api/...\` routes. */
export const readGatewayProjectId = (): string | null => process.env.MAIN_GATEWAY_PROJECT_ID?.trim() || null;

/** Storage origin for direct mode (default storage port 3080). */
export const readDirectBackendUrl = (): string | null => {
  const url = process.env.STORAGE_URL?.trim();
  return url ? normalizeBaseUrl(url) : null;
};

export const readDirectBackendSecret = (): string | null => process.env.STORAGE_SECRET?.trim() || null;

export const readDispatcherGateSecret = (): string | null => process.env.DISPATCHER_GATE_SECRET?.trim() || null;

/** CANONICAL_DATA_ACCESS_MODE=direct|gateway, else gateway when its three settings are present. */
export const readCanonicalDataAccessMode = (): CanonicalDataAccessMode => {
  const raw = process.env.CANONICAL_DATA_ACCESS_MODE?.trim().toLowerCase();
  if (raw === 'gateway' || raw === 'direct') return raw;
  if (readMainGatewayUrl() && readGatewayProjectId() && readDispatcherGateSecret()) return 'gateway';
  return 'direct';
};

/** What is missing from .env for the current mode, or null when configured. */
export const describeCanonicalDataConfigGap = (): string | null => {
  const missing: string[] = [];
  if (readCanonicalDataAccessMode() === 'gateway') {
    if (!readMainGatewayUrl()) missing.push('MAIN_GATEWAY_URL');
    if (!readGatewayProjectId()) missing.push('MAIN_GATEWAY_PROJECT_ID');
    if (!readDispatcherGateSecret()) missing.push('DISPATCHER_GATE_SECRET');
    return missing.length > 0 ? \`Gateway mode: set \${missing.join(', ')} in .env\` : null;
  }
  if (!readDirectBackendUrl()) missing.push('STORAGE_URL');
  if (!readDirectBackendSecret()) missing.push('STORAGE_SECRET');
  return missing.length > 0 ? \`Direct mode: set \${missing.join(', ')} in .env\` : null;
};

export const readCanonicalDataRequestTimeoutMs = (): number => {
  const parsed = Number(process.env.CANONICAL_DATA_REQUEST_TIMEOUT_MS?.trim() || 10_000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
};
`;

const EXPRESS_CLIENT_GET = `import {
  describeCanonicalDataConfigGap,
  readCanonicalDataAccessMode,
  readDirectBackendSecret,
  readDirectBackendUrl,
  readDispatcherGateSecret,
  readGatewayProjectId,
  readMainGatewayUrl,
} from './config';
import type { CanonicalDataClient } from './types';

let managedClient: CanonicalDataClient | null = null;

/**
 * Returns the storage client (created once from .env), or null when it is not configured.
 */
export const getManagedCanonicalDataClient = (): CanonicalDataClient | null => {
  if (managedClient) return managedClient;
  const gap = describeCanonicalDataConfigGap();
  if (gap) {
    console.error(\`❌ Storage client not configured. \${gap}\`);
    return null;
  }
  const accessMode = readCanonicalDataAccessMode();
  managedClient = {
    accessMode,
    gatewayUrl: accessMode === 'gateway' ? readMainGatewayUrl() : null,
    gatewayProjectId: accessMode === 'gateway' ? readGatewayProjectId() : null,
    directUrl: accessMode === 'direct' ? readDirectBackendUrl() : null,
    secret: accessMode === 'direct' ? readDirectBackendSecret() : null,
    gateSecret: accessMode === 'gateway' ? readDispatcherGateSecret() : null,
  };
  return managedClient;
};
`;

const EXPRESS_CLIENT_INVOKE = `import { readCanonicalDataRequestTimeoutMs } from './config';
import type { CanonicalDataClient, CanonicalDataEnvelope } from './types';

const INVOKE_PATH = '/api/storage/v1/invoke';

const invokeUrl = (client: CanonicalDataClient): string => {
  if (client.accessMode === 'gateway') {
    if (!client.gatewayUrl || !client.gatewayProjectId) throw new Error('Gateway client missing MAIN_GATEWAY_URL or MAIN_GATEWAY_PROJECT_ID');
    return \`\${client.gatewayUrl}/\${client.gatewayProjectId}\${INVOKE_PATH}\`;
  }
  if (!client.directUrl) throw new Error('STORAGE_URL is not configured');
  return \`\${client.directUrl}\${INVOKE_PATH}\`;
};

/**
 * Runs a named storage operation (POST /api/storage/v1/invoke) and returns its data, or throws
 * the storage error.
 */
export const invokeCanonicalDataOperation = async <T>(
  client: CanonicalDataClient,
  operation: string,
  args: unknown[] = [],
): Promise<T> => {
  const timeoutMs = readCanonicalDataRequestTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (client.secret) headers['x-storage-secret'] = client.secret;
  if (client.gateSecret) headers['x-dispatcher-gate-secret'] = client.gateSecret;
  try {
    let response: Response;
    try {
      response = await fetch(invokeUrl(client), {
        method: 'POST',
        headers,
        body: JSON.stringify({ operation, args }),
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) throw new Error(\`Storage request timed out after \${timeoutMs}ms\`);
      throw error instanceof Error ? error : new Error('Storage request failed');
    }
    let json: CanonicalDataEnvelope<T>;
    try {
      json = (await response.json()) as CanonicalDataEnvelope<T>;
    } catch {
      throw new Error(\`Storage returned non-JSON (\${response.status})\`);
    }
    if (!response.ok || !json.success) throw new Error(json.error ?? \`Storage request failed (\${response.status})\`);
    return json.data as T;
  } finally {
    clearTimeout(timeout);
  }
};
`;

const EXPRESS_CLIENT_INDEX = `export type { CanonicalDataAccessMode, CanonicalDataClient } from './types';
export { describeCanonicalDataConfigGap, readCanonicalDataAccessMode } from './config';
export { getManagedCanonicalDataClient } from './get-managed-canonical-data-client';
export { invokeCanonicalDataOperation } from './invoke-canonical-data-operation';
`;

const EXPRESS_PICK_FIELDS = `/**
 * Copies only the allowed keys from a JSON body (unknown keys are dropped).
 */
export const pickFields = (body: unknown, fields: readonly string[]): Record<string, unknown> => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return {};
  const source = body as Record<string, unknown>;
  return Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));
};
`;

/** Express files the generated wrappers, services and handlers import. */
export const EXPRESS_SUPPORT_FILES: SupportFile[] = [
  { path: 'src/services/canonical-data-client/types.ts', content: EXPRESS_CLIENT_TYPES },
  { path: 'src/services/canonical-data-client/config.ts', content: EXPRESS_CLIENT_CONFIG },
  { path: 'src/services/canonical-data-client/get-managed-canonical-data-client.ts', content: EXPRESS_CLIENT_GET },
  { path: 'src/services/canonical-data-client/invoke-canonical-data-operation.ts', content: EXPRESS_CLIENT_INVOKE },
  { path: 'src/services/canonical-data-client/index.ts', content: EXPRESS_CLIENT_INDEX },
  { path: 'src/utils/http/pick-fields.ts', content: EXPRESS_PICK_FIELDS },
];

// ------------------------------------------------------------------------------------ web

const WEB_API_TYPES = `export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/** Every src/api call returns this; httpStatus 0 means the request never got a response. */
export type ApiResult<T> = ApiResponse<T> & { httpStatus: number };
`;

const WEB_API_CONFIG = `/**
 * Same-origin data URL: the browser calls /api/data/* on the web app, and
 * src/app/api/data/[...path]/route.ts forwards it to API express.
 */
export const getExpressDataUrl = (path: string): string => \`/api/data\${path.startsWith('/') ? path : \`/\${path}\`}\`;
`;

const WEB_REQUEST_API = `import type { ApiResponse, ApiResult } from './types';

const TIMEOUT_MS = 60_000;

/**
 * fetch wrapper for API express: never throws; returns success, data/error and httpStatus.
 */
export const requestApi = async <T>(url: string, init?: RequestInit): Promise<ApiResult<T>> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers = new Headers(init?.headers ?? undefined);
    if (typeof init?.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    let response: Response;
    try {
      response = await fetch(url, { ...init, headers, signal: controller.signal });
    } catch (error) {
      const message = controller.signal.aborted
        ? \`Request timed out after \${TIMEOUT_MS}ms\`
        : error instanceof Error
          ? error.message
          : 'Network error';
      return { success: false, error: message, httpStatus: 0 };
    }
    const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    if (json && typeof json === 'object' && 'success' in json) return { ...json, httpStatus: response.status };
    return { success: false, error: \`HTTP \${response.status}\`, httpStatus: response.status };
  } finally {
    clearTimeout(timeout);
  }
};
`;

const WEB_MAP_FAILURE = `import type { ApiResult } from './types';

/**
 * Maps a failed API result to a thunk status code (400 for client errors, else 500).
 */
export const mapApiFailureToThunkStatus = (result: ApiResult<unknown>): 400 | 500 =>
  result.httpStatus >= 400 && result.httpStatus < 500 ? 400 : 500;
`;

const WEB_API_SHARED_INDEX = `export type { ApiResponse, ApiResult } from './types';
export { getExpressDataUrl } from './config';
export { requestApi } from './request-api';
export { mapApiFailureToThunkStatus } from './map-api-failure-to-thunk-status';
`;

const WEB_RESOLVE_UPSTREAM = `export type ApiUpstreamTarget = { baseUrl: string; useGateSecret: boolean } | { error: string };

const trimTrailingSlash = (value: string): string => value.replace(/\\/$/, '');

/**
 * Server-only API express location: EXPRESS_API_URL (direct), or the main gateway project
 * (MAIN_GATEWAY_URL + MAIN_GATEWAY_PROJECT_ID + DISPATCHER_GATE_SECRET).
 */
export const resolveApiUpstream = (): ApiUpstreamTarget => {
  const direct = process.env.EXPRESS_API_URL?.trim();
  if (direct) return { baseUrl: trimTrailingSlash(direct), useGateSecret: false };
  const gateway = process.env.MAIN_GATEWAY_URL?.trim();
  const projectId = process.env.MAIN_GATEWAY_PROJECT_ID?.trim();
  if (gateway && projectId && process.env.DISPATCHER_GATE_SECRET?.trim()) {
    return { baseUrl: \`\${trimTrailingSlash(gateway)}/\${projectId}\`, useGateSecret: true };
  }
  return { error: 'Set EXPRESS_API_URL, or MAIN_GATEWAY_URL + MAIN_GATEWAY_PROJECT_ID + DISPATCHER_GATE_SECRET, in the web .env' };
};
`;

const WEB_PROXY = `import { NextResponse } from 'next/server';
import { resolveApiUpstream } from './resolve-api-upstream';

/**
 * Forwards a request to API express (direct or through the main gateway with the gate secret).
 */
export const proxyToExpress = async (upstreamPath: string, init: RequestInit): Promise<NextResponse> => {
  const upstream = resolveApiUpstream();
  if ('error' in upstream) return NextResponse.json({ success: false, error: upstream.error }, { status: 500 });

  const headers = new Headers(init.headers ?? undefined);
  if (upstream.useGateSecret) headers.set('x-dispatcher-gate-secret', process.env.DISPATCHER_GATE_SECRET?.trim() ?? '');
  const url = \`\${upstream.baseUrl}\${upstreamPath}\`;
  try {
    const response = await fetch(url, { ...init, headers, cache: 'no-store' });
    const body = await response.text();
    if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
      return NextResponse.json({ success: false, error: \`Upstream returned non-JSON (HTTP \${response.status})\` }, { status: 502 });
    }
    return new NextResponse(body, { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error';
    return NextResponse.json({ success: false, error: \`Could not reach API express: \${message}\` }, { status: 502 });
  }
};
`;

const WEB_DATA_ROUTE = `import type { NextRequest } from 'next/server';
import { proxyToExpress } from '../../_shared/proxy-to-express';

type Context = { params: Promise<{ path: string[] }> };

const upstreamPath = async (req: NextRequest, context: Context): Promise<string> => {
  const { path } = await context.params;
  return \`/api/data/\${path.join('/')}\${req.nextUrl.search}\`;
};

const withBody = async (req: NextRequest, method: string): Promise<RequestInit> => {
  const body = await req.text();
  return { method, body: body || undefined, headers: body ? { 'Content-Type': 'application/json' } : undefined };
};

/** GET /api/data/* → API express */
export const GET = async (req: NextRequest, context: Context) => proxyToExpress(await upstreamPath(req, context), { method: 'GET' });

/** POST /api/data/* → API express */
export const POST = async (req: NextRequest, context: Context) =>
  proxyToExpress(await upstreamPath(req, context), await withBody(req, 'POST'));

/** PATCH /api/data/* → API express */
export const PATCH = async (req: NextRequest, context: Context) =>
  proxyToExpress(await upstreamPath(req, context), await withBody(req, 'PATCH'));

/** DELETE /api/data/* → API express */
export const DELETE = async (req: NextRequest, context: Context) =>
  proxyToExpress(await upstreamPath(req, context), { method: 'DELETE' });
`;

const WEB_APP_THUNK = `import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

/** Hand-written thunk type; every thunk resolves to a status code (ADR 001). */
export type AppThunk<ReturnType = Promise<200 | 400 | 500>> = ThunkAction<ReturnType, RootState, unknown, UnknownAction>;
`;

/** Web files the generated api functions, proxy and thunks import. */
export const WEB_SUPPORT_FILES: SupportFile[] = [
  { path: 'src/api/_shared/types.ts', content: WEB_API_TYPES },
  { path: 'src/api/_shared/config.ts', content: WEB_API_CONFIG },
  { path: 'src/api/_shared/request-api.ts', content: WEB_REQUEST_API },
  { path: 'src/api/_shared/map-api-failure-to-thunk-status.ts', content: WEB_MAP_FAILURE },
  { path: 'src/api/_shared/index.ts', content: WEB_API_SHARED_INDEX },
  { path: 'src/app/api/_shared/resolve-api-upstream.ts', content: WEB_RESOLVE_UPSTREAM },
  { path: 'src/app/api/_shared/proxy-to-express.ts', content: WEB_PROXY },
  { path: 'src/app/api/data/[...path]/route.ts', content: WEB_DATA_ROUTE },
  { path: 'src/store/app-thunk.ts', content: WEB_APP_THUNK },
];
