# 009 – Storage / API split

## Status

Accepted

## Context

Code Control's canonical Postgres lives on one host (storage). The API may run on another Mac. Same pattern as Code Commit Summaries ([hub guide](https://github.com/luckee-hub/luckee-hub-express-server/blob/main/data/location_installation/web-express-remote-storage-deployment.md)).

## Decision

| Repo | Role |
|------|------|
| `code-generator-storage-server` | Owns Postgres, migrations, and all CRUD SQL. `/api/storage/*` on LAN (default port 3080). |
| `code-control-express-server` | GitHub, business logic, HTTP API for the web. **No `DATABASE_URL`, no `pg`.** |

### Express data layer

- `src/data/{table}/` stays one function per file, but each function calls storage instead of SQL:

```ts
export const getProjectById = async (storage: StorageClient, id: string): Promise<Project | null> =>
  invokeStorageOperation<Project | null>(storage, 'getProjectById', [id]);
```

- The operation name **is** the storage data function name. Storage builds its whitelist from the exports of its `src/data/*` barrels.
- `StorageClient` is the managed client: `initializeManagedStorageClient()` at startup, `getManagedStorageClient()` / `requireStorageClient(res)` in handlers (null → `500`), passed into `processX()` and then data functions — same flow as a managed pool.
- Table folders match table names: `customers/`, `customer-projects/`, `customer-project-repos/`.
- Row types live in `src/model/`, kept identical in both repos.

### Auth

Header `x-storage-secret`: storage `STORAGE_DISPATCHER_SECRET` = express `CODE_CONTROL_STORAGE_SECRET` (direct mode only). Gateway mode: express sends `DISPATCHER_GATE_SECRET`; project dispatcher injects storage secret. `/api/storage/health` is public; everything else requires the secret on direct calls.

### Temp migration

Storage: `POST /api/storage/seed/export`, `POST /api/storage/seed/import` (`confirm: REPLACE_STUDIO_CODE_CONTROL`). Express: `POST /api/admin/temp-import-from-laptop-storage` when `TEMP_MIGRATION_ENABLED=true`. Procedure: [CODE-CONTROL-STUDIO-DATA-MIGRATION.md](../../../../on-device-dispatcher/on-device-dispatcher-express-server/docs/CODE-CONTROL-STUDIO-DATA-MIGRATION.md). Remove temp env after the studio owns the data.

## Availability

- Express must **start and pass Hub health** when storage is down. `GET /api/health` is **liveness only** (always HTTP 200); `storage` / `database` in the body report dependency state.
- Storage HTTP calls use `StorageUnavailableError` (`unreachable` | `timeout`) for refused hosts and aborts; data handlers log one line and return 500 with that message.
- Health probes storage with a **750ms** timeout, **2s** cache, and logs only when reachability changes.

## Consequences

- Adding CRUD = SQL function in storage `src/data/{table}/` + wrapper in express `src/data/{table}/` with the same name. Deploy storage first; express gets `Unknown operation` otherwise.
- New tables: migration + seed table list (`seed-table-names.ts`) in storage.
- Browsers never call storage.
