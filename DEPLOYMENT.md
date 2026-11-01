# Code Control — deployment

## Split layout

| Role | Repo | Port (default) |
|------|------|----------------|
| Storage (canonical Postgres CRUD) | `code-generator-storage-server` | 3080 |
| API (GitHub, business logic, HTTP for the web) | `code-control-express-server` | 3012 Hub / 3010 standalone |
| Web | `code-control` | 3013 Hub / 3000 standalone |
| Project dispatcher (studio homelab) | `code-control-express-dispatcher-server` | 3055 |
| Dispatcher admin UI | `code-control-dispatcher-web` | 3054 |

```text
Browser ──► code-control (Next) ──► code-control-express-server ──► storage or main gateway ──► Postgres (studio)
```

- Express has **no `DATABASE_URL`**. CRUD is `POST /api/storage/v1/invoke` (direct or via gateway proxy).
- Migrations live in **code-generator-storage-server**.

## Env (express)

| Where | Variables |
|-------|-----------|
| Studio Hub (local storage) | `CODE_CONTROL_STORAGE_URL=http://127.0.0.1:3080`, `CODE_CONTROL_STORAGE_SECRET` (= storage `STORAGE_DISPATCHER_SECRET`) |
| Laptop → studio gateway | `MAIN_GATEWAY_URL=http://<STUDIO>:3010`, `DISPATCHER_GATE_SECRET` (no storage secret on laptop) |
| CRM (My Ops customers) | `MAIN_GATEWAY_URL`, `DISPATCHER_GATE_SECRET`, `OPS_TRACKER_GATEWAY_PROJECT_ID=my-ops-tracker` — required for `/api/crm/*` even when Code Control storage uses direct mode |

## CRM (My Ops Tracker via main gateway)

Customers for Code Control are read from **my-ops-tracker storage** through the studio main gateway (same pattern as estimate-and-proposals ADR 010). Express proxies `GET /api/crm/*` to `{MAIN_GATEWAY_URL}/{OPS_TRACKER_GATEWAY_PROJECT_ID}/api/storage/...`.

**Prerequisites**

1. Main gateway migration `on-device-dispatcher-express-server/migrations/013_my_ops_tracker_gateway.sql` applied.
2. My Ops storage migration `004_dispatcher_exposed_endpoints.sql` exposes `GET /api/storage/customers` and `POST /api/storage/v1/invoke`.
3. CRM data exists in my-ops Postgres (`customers` table).

**Sanity checks**

```bash
curl -sS -H "x-dispatcher-gate-secret: $DISPATCHER_GATE_SECRET" \
  "http://127.0.0.1:3010/my-ops-tracker/api/storage/customers"
curl -sS "http://127.0.0.1:3012/api/crm/customers"
```

See `.cursor/architecture/010-hybrid-crm-ops-tracker.md`.

## Homelab gateway (studio)

Generic wiring: [on-device-dispatcher `Add a new project dispatcher.md`](../../on-device-dispatcher/on-device-dispatcher-express-server/Add%20a%20new%20project%20dispatcher.md) and [STUDIO-GATEWAY-SETUP.md](../../on-device-dispatcher/on-device-dispatcher-express-server/STUDIO-GATEWAY-SETUP.md). Gateway SQL for this product: `on-device-dispatcher-express-server/migrations/004_code_control_gateway.sql`; storage catalog seed: `code-generator-storage-server/migrations/092_dispatcher_exposed_endpoints.sql`.

## Studio Postgres

[docs/studio-local-postgres-setup.md](./docs/studio-local-postgres-setup.md)

## Hub pattern

[luckee-hub `web-express-remote-storage-deployment.md`](https://github.com/luckee-hub/luckee-hub-express-server/blob/main/data/location_installation/web-express-remote-storage-deployment.md)

## Troubleshooting (express health)

Express **`GET /api/health` always returns HTTP 200**. Use `storage` and `database` in the body.

| Symptom | Fix |
|---------|-----|
| Health `storage: "unconfigured"` | Direct: `CODE_CONTROL_STORAGE_URL` + `CODE_CONTROL_STORAGE_SECRET`. Gateway: `MAIN_GATEWAY_URL` + `DISPATCHER_GATE_SECRET` |
| Health `storage: "error"` | Storage down, wrong IP, bind host, firewall, or gateway / child dispatcher not running |
| `Unauthorized` | Secret mismatch (direct) or gate secret (gateway) |
| `database: "error"` | Postgres down or wrong `DATABASE_URL` on storage host |
