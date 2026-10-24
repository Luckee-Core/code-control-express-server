import { readMainGatewayUrl } from '../canonical-data-client/config';
import {
  getManagedCanonicalDataClient,
  requestAtAbsoluteUrl,
  requestWithCanonicalDataClient,
} from '../canonical-data-client';

export type ComponentStatus = 'ok' | 'unconfigured' | 'error';

export type CanonicalDataProbe = {
  canonicalData: ComponentStatus;
  database: ComponentStatus;
  checkedAt: number;
};

const CACHE_MS = 2000;
const GATEWAY_PROBE_TIMEOUT_MS = 8_000;
const DIRECT_PROBE_TIMEOUT_MS = 750;

let lastProbe: CanonicalDataProbe | null = null;
let inFlight: Promise<CanonicalDataProbe> | null = null;
let lastLoggedCanonicalData: ComponentStatus | null = null;

const unconfiguredProbe = (): CanonicalDataProbe => ({
  canonicalData: 'unconfigured',
  database: 'unconfigured',
  checkedAt: Date.now(),
});

const logCanonicalDataStatusChange = (
  label: string,
  probe: CanonicalDataProbe,
  detail?: string,
): void => {
  if (probe.canonicalData === lastLoggedCanonicalData) {
    return;
  }
  lastLoggedCanonicalData = probe.canonicalData;
  if (probe.canonicalData === 'error') {
    const suffix = detail?.trim() ? `: ${detail}` : '';
    console.warn(`⚠️ [health] Canonical data check failed (${label})${suffix}`);
    return;
  }
  if (probe.canonicalData === 'ok') {
    console.log(`✅ [health] Canonical data reachable (${label})`);
  }
};

/**
 * Liveness for canonical data: gateway mode pings main gateway only; direct mode pings backend health.
 */
export const probeCanonicalData = async (): Promise<CanonicalDataProbe> => {
  const client = getManagedCanonicalDataClient();
  if (!client) {
    return unconfiguredProbe();
  }

  const now = Date.now();
  if (lastProbe && now - lastProbe.checkedAt < CACHE_MS) {
    return lastProbe;
  }
  if (inFlight) {
    return inFlight;
  }

  inFlight = (async (): Promise<CanonicalDataProbe> => {
    try {
      if (client.accessMode === 'gateway') {
        const gatewayUrl = readMainGatewayUrl();
        if (!gatewayUrl) {
          return unconfiguredProbe();
        }
        await requestAtAbsoluteUrl<{ status?: string }>(gatewayUrl, '/api/health', {
          gateSecret: client.gateSecret,
          timeoutMs: GATEWAY_PROBE_TIMEOUT_MS,
        });
        const probe: CanonicalDataProbe = {
          canonicalData: 'ok',
          database: 'unconfigured',
          checkedAt: Date.now(),
        };
        logCanonicalDataStatusChange(`gateway ${gatewayUrl}`, probe);
        lastProbe = probe;
        return probe;
      }

      const data = await requestWithCanonicalDataClient<{ database?: ComponentStatus }>(
        client,
        '/api/storage/health',
        { timeoutMs: DIRECT_PROBE_TIMEOUT_MS },
      );
      const probe: CanonicalDataProbe = {
        canonicalData: 'ok',
        database: data.database ?? 'error',
        checkedAt: Date.now(),
      };
      logCanonicalDataStatusChange(client.directUrl ?? 'direct', probe);
      lastProbe = probe;
      return probe;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const probe: CanonicalDataProbe = {
        canonicalData: 'error',
        database: 'error',
        checkedAt: Date.now(),
      };
      const label =
        client.accessMode === 'gateway'
          ? `gateway ${client.gatewayUrl}`
          : (client.directUrl ?? 'direct');
      logCanonicalDataStatusChange(label, probe, message);
      lastProbe = probe;
      return probe;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};
