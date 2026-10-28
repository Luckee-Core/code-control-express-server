import {
  getManagedCanonicalDataClient,
  requestWithCanonicalDataClient,
} from '../canonical-data-client';

export type ComponentStatus = 'ok' | 'unconfigured' | 'error';

export type CanonicalDataProbe = {
  canonicalData: ComponentStatus;
  database: ComponentStatus;
  checkedAt: number;
  detail: string | null;
};

const CACHE_MS = 2000;
const GATEWAY_PROBE_TIMEOUT_MS = 8_000;
const DIRECT_PROBE_TIMEOUT_MS = 8_000;

let lastProbe: CanonicalDataProbe | null = null;
let inFlight: Promise<CanonicalDataProbe> | null = null;
let lastLoggedCanonicalData: ComponentStatus | null = null;

const unconfiguredProbe = (): CanonicalDataProbe => ({
  canonicalData: 'unconfigured',
  database: 'unconfigured',
  checkedAt: Date.now(),
  detail: null,
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
 * Liveness for canonical data: gateway and direct both ping `/api/storage/health` on the data plane.
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
      const timeoutMs =
        client.accessMode === 'gateway' ? GATEWAY_PROBE_TIMEOUT_MS : DIRECT_PROBE_TIMEOUT_MS;

      const data = await requestWithCanonicalDataClient<{ database?: ComponentStatus }>(
        client,
        '/api/storage/health',
        { timeoutMs },
      );
      const probe: CanonicalDataProbe = {
        canonicalData: 'ok',
        database: data.database ?? 'error',
        checkedAt: Date.now(),
        detail: null,
      };
      const label =
        client.accessMode === 'gateway'
          ? `gateway ${client.gatewayUrl}/${client.gatewayProjectId}`
          : (client.directUrl ?? 'direct');
      logCanonicalDataStatusChange(label, probe);
      lastProbe = probe;
      return probe;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const probe: CanonicalDataProbe = {
        canonicalData: 'error',
        database: 'error',
        checkedAt: Date.now(),
        detail: message,
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
