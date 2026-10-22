import { getManagedStorageClient, requestStorageAtUrl } from '../storage-client';

export type ComponentStatus = 'ok' | 'unconfigured' | 'error';

export type StorageProbe = {
  storage: ComponentStatus;
  database: ComponentStatus;
  checkedAt: number;
};

const CACHE_MS = 2000;
const HEALTH_PROBE_TIMEOUT_MS = 750;

let lastProbe: StorageProbe | null = null;
let inFlight: Promise<StorageProbe> | null = null;
let lastLoggedStorage: ComponentStatus | null = null;

const unconfiguredProbe = (): StorageProbe => ({
  storage: 'unconfigured',
  database: 'unconfigured',
  checkedAt: Date.now(),
});

const logStorageStatusChange = (url: string, probe: StorageProbe): void => {
  if (probe.storage === lastLoggedStorage) {
    return;
  }
  lastLoggedStorage = probe.storage;
  if (probe.storage === 'error') {
    console.warn(
      `⚠️ [storage] Unreachable at ${url} — data routes return 500 until code-generator-storage-server is running`,
    );
    return;
  }
  if (probe.storage === 'ok') {
    console.log(`✅ [storage] Reachable at ${url} (database: ${probe.database})`);
  }
};

/**
 * Pings Storage Express health with a short timeout; caches results and logs only on status change.
 */
export const probeStorage = async (): Promise<StorageProbe> => {
  const client = getManagedStorageClient();
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

  inFlight = (async (): Promise<StorageProbe> => {
    try {
      const data = await requestStorageAtUrl<{ database?: ComponentStatus }>(
        client.baseUrl,
        '/api/storage/health',
        { secret: client.secret, timeoutMs: HEALTH_PROBE_TIMEOUT_MS },
      );
      const probe: StorageProbe = {
        storage: 'ok',
        database: data.database ?? 'error',
        checkedAt: Date.now(),
      };
      logStorageStatusChange(client.baseUrl, probe);
      lastProbe = probe;
      return probe;
    } catch {
      const probe: StorageProbe = {
        storage: 'error',
        database: 'error',
        checkedAt: Date.now(),
      };
      logStorageStatusChange(client.baseUrl, probe);
      lastProbe = probe;
      return probe;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};
