# Code Control — deployment

**Laptop → studio data migration (one-time):** canonical guide lives in the on-device dispatcher repo:

**[CODE-CONTROL-STUDIO-DATA-MIGRATION.md](../../on-device-dispatcher/on-device-dispatcher-express-server/docs/CODE-CONTROL-STUDIO-DATA-MIGRATION.md)** in `on-device-dispatcher-express-server/docs/`.

---

## Split layout (steady state)

| Role | Repo | Port (default) |
|------|------|----------------|
| Storage (canonical Postgres CRUD) | `code-generator-storage-server` | 3080 |
| API (GitHub, business logic, HTTP for the web) | `code-control-express-server` | 3012 Hub / 3010 standalone |
| Web | `code-control` | 3013 Hub / 3000 standalone |

```text
Browser ──► code-control (Next) ──► code-control-express-server ──► code-generator-storage-server ──► Postgres (127.0.0.1)
```

- Express has **no `DATABASE_URL`**. CRUD is `POST /api/storage/v1/invoke` on storage.
- Migrations live in **code-generator-storage-server**.

## Shared secret

| Host | File | Variable |
|------|------|----------|
| Storage host | `code-generator-storage-server/.env` | `STORAGE_DISPATCHER_SECRET` |
| Express host | `code-control-express-server/.env` | `STORAGE_EXPRESS_SECRET` (same value) |

## More detail

- Studio Postgres + ports: [docs/studio-local-postgres-setup.md](./docs/studio-local-postgres-setup.md)
- Hub remote-storage pattern: [luckee-hub-express-server `web-express-remote-storage-deployment.md`](https://github.com/luckee-hub/luckee-hub-express-server/blob/main/data/location_installation/web-express-remote-storage-deployment.md)
- Gateway registration: [on-device-dispatcher `CODE-CONTROL-GATEWAY-REGISTRATION.md`](../../on-device-dispatcher/on-device-dispatcher-express-server/docs/CODE-CONTROL-GATEWAY-REGISTRATION.md) (relative from a combined `luckee/` tree)

## Troubleshooting (express health)

Express **`GET /api/health` always returns HTTP 200**. Use `storage` and `database` in the body. Default `STORAGE_REQUEST_TIMEOUT_MS` is **10s**.

| Symptom | Fix |
|---------|-----|
| Health `storage: "unconfigured"` | `STORAGE_EXPRESS_URL` + `STORAGE_EXPRESS_SECRET` in express `.env` |
| Health `storage: "error"` | Storage down, wrong IP, `STORAGE_BIND_HOST=127.0.0.1`, or firewall |
| `Unauthorized` | Secret mismatch between storage and express |
| `database: "error"` | Postgres down or wrong `DATABASE_URL` on storage host |
