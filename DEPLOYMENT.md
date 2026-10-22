# Code Control — deployment

Pattern: Luckee Hub [web-express-remote-storage-deployment.md](https://github.com/luckee-hub/luckee-hub-express-server/blob/main/data/location_installation/web-express-remote-storage-deployment.md) (local path in hub repo: `data/location_installation/`).

## Split layout

| Role | Repo | Port (default) |
|------|------|----------------|
| Storage (canonical Postgres CRUD) | `code-generator-storage-server` | 3080 |
| API (GitHub, business logic, HTTP for the web) | `code-control-express-server` | 3012 Hub / 3010 standalone |
| Web | `code-control` | 3013 Hub / 3000 standalone |

```text
Browser ──► code-control (Next) ──► code-control-express-server ──► code-generator-storage-server ──► Postgres (127.0.0.1)
```

- Express has **no `DATABASE_URL`**. Every CRUD call in `src/data/` is `POST /api/storage/v1/invoke` on storage.
- Storage is the only process that runs SQL. Postgres listens on `127.0.0.1` only; never open 5432 on the LAN.
- Browsers never call storage. Only express does, with `x-storage-secret`.
- Migrations and the Supabase import script live in the storage repo.

## Shared secret (once)

```bash
openssl rand -base64 32
```

| Host | File | Variable |
|------|------|----------|
| Storage host | `code-generator-storage-server/.env` | `STORAGE_DISPATCHER_SECRET` |
| Every express host | `code-control-express-server/.env` | `STORAGE_EXPRESS_SECRET` (same value) |

## Phase 1 — storage on laptop, express on studio

Laptop already has the `code_control` database.

**Laptop** `code-generator-storage-server/.env`:

```env
PORT=3080
STORAGE_BIND_HOST=0.0.0.0
DATABASE_URL=postgresql://127.0.0.1:5432/code_control
STORAGE_DISPATCHER_SECRET=<secret>
```

```bash
npm install && npm run dev
curl -s http://127.0.0.1:3080/api/storage/health        # database: "ok"
```

**Studio** `code-control-express-server/.env`:

```env
PORT=3012
STORAGE_EXPRESS_URL=http://<LAPTOP_LAN_IP>:3080
STORAGE_EXPRESS_SECRET=<secret>
# GITHUB_* as in .env.example
```

```bash
# from studio — must return 200 with the secret, 401 without
curl -s -H "x-storage-secret: <secret>" http://<LAPTOP_LAN_IP>:3080/api/storage/meta
npm run dev
curl -s http://127.0.0.1:3012/api/health                 # storage: "ok", database: "ok"
```

Studio web: `CODE_CONTROL_API_URL=http://127.0.0.1:3012`.

## Phase 2 — temp migration laptop → studio

1. Laptop: keep storage running as in phase 1 (`STORAGE_BIND_HOST=0.0.0.0`).
2. Studio: Postgres, migrations, empty storage:

   ```bash
   createdb code_control
   cd code-generator-storage-server
   cp .env.example .env          # DATABASE_URL=127.0.0.1/code_control, same secret
   npm install
   npm run db:apply-migrations
   npm run dev                   # :3080
   ```

3. Studio express `.env` (temporary additions):

   ```env
   TEMP_MIGRATION_ENABLED=true
   LAPTOP_STORAGE_EXPRESS_URL=http://<LAPTOP_LAN_IP>:3080
   STORAGE_IMPORT_TARGET_URL=http://127.0.0.1:3080
   ```

4. Restart studio express, then:

   ```bash
   curl -s -X POST http://127.0.0.1:3012/api/admin/temp-import-from-laptop-storage
   ```

   The import replaces all studio rows in `customers`, `customer_projects`, `customer_project_repos` in one transaction and returns per-table row counts.

5. Verify counts match:

   ```bash
   curl -s -H "x-storage-secret: <secret>" http://<LAPTOP_LAN_IP>:3080/api/storage/meta
   curl -s -H "x-storage-secret: <secret>" http://127.0.0.1:3080/api/storage/meta
   ```

6. Studio express: set `STORAGE_EXPRESS_URL=http://127.0.0.1:3080`, remove the three `TEMP_*` / `LAPTOP_*` / `STORAGE_IMPORT_*` lines, restart.

## Phase 3 — express on laptop, storage on studio

1. Laptop: stop storage.
2. Laptop express `.env`: `STORAGE_EXPRESS_URL=http://<STUDIO_LAN_IP>:3080`. Restart.
3. Studio storage: `STORAGE_BIND_HOST=0.0.0.0` so the laptop can reach it.
4. `curl -s http://127.0.0.1:3012/api/health` on the laptop → `storage: "ok"`, `storageUrl` = studio.

The laptop's `code_control` database is now a stale copy. Leave it or drop it once you trust the studio.

## Troubleshooting

Express **`GET /api/health` always returns HTTP 200** (liveness for Luckee Hub). Read `storage` and `database` in the JSON body — `status: degraded` is normal while storage is down. Data routes return **500** until storage is reachable. Default `STORAGE_REQUEST_TIMEOUT_MS` is **10s** (override in express `.env`). Hub **Run** does not start storage; use the Hub project **Start storage** control or `npm run dev` in `code-generator-storage-server`.

| Symptom | Fix |
|---------|-----|
| Health `storage: "unconfigured"` | Set `STORAGE_EXPRESS_URL` + `STORAGE_EXPRESS_SECRET` in express `.env`, restart |
| Health `storage: "error"` / `Storage Express unreachable` | Storage not running, wrong IP, `STORAGE_BIND_HOST=127.0.0.1`, or macOS firewall blocking 3080 |
| `Unauthorized` | Secrets differ between storage and express |
| `Storage auth is not configured` | `STORAGE_DISPATCHER_SECRET` missing on storage |
| `Unknown operation: X` | Storage is behind express — add the data function to storage `src/data/` and restart storage |
| Health `database: "error"` | Postgres down on the storage host, or wrong `DATABASE_URL` there |
