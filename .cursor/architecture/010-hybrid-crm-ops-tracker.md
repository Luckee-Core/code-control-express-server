# 010 – Hybrid CRM (my-ops-tracker via main gateway)

Customers for Code Control are read from **my-ops-tracker storage** (Postgres CRM), not the local Code Control `customers` table (legacy; dropped by storage migration 095 — the one-time customer-ops-sync tool was removed after the studio database finished the transition on 2026-11-18). Express proxies `GET /api/crm/*` through the **studio main gateway** into the **my-ops-tracker** project dispatcher → storage.

Reference implementation: estimate-and-proposals-express-server ADR 010 (same env vars and `ops-tracker-client` module).

## Flow

```
Code Control web  →  Next /api/*  →  code-control-express-server
Express GET /api/crm/*  →  MAIN_GATEWAY_URL / OPS_TRACKER_GATEWAY_PROJECT_ID /api/storage/…
```

Gate auth uses the **main** dispatcher secret (`DISPATCHER_GATE_SECRET`).

## Dual gateway project ids on one express process

| Concern | Env project id | Typical paths |
|---------|----------------|---------------|
| Code Control storage | `MAIN_GATEWAY_PROJECT_ID` (`code-control`) | `/api/code-control/storage/v1/invoke` |
| CRM reads | `OPS_TRACKER_GATEWAY_PROJECT_ID` (`my-ops-tracker`) | `/api/storage/customers`, invoke |

Code Control storage may use **direct loopback** (`CODE_CONTROL_DIRECT_*`) while CRM uses the gateway; no conflict.

## Environment

```env
MAIN_GATEWAY_URL=http://127.0.0.1:3010
DISPATCHER_GATE_SECRET=<same as on-device-dispatcher main gate>
OPS_TRACKER_GATEWAY_PROJECT_ID=my-ops-tracker
```

## Prerequisites

1. Main gateway migration `013_my_ops_tracker_gateway.sql` applied; my-ops storage `004_dispatcher_exposed_endpoints.sql` exposes customers + invoke.
2. CRM data in my-ops Postgres.

## Implementation

`src/services/ops-tracker-client/` — config, URL builder, gateway fetch, path parser, `requestOpsTracker`, startup `initializeOpsTrackerGatewayClient()` in `index.ts`.

Call sites: `crm-proxy/routes/proxy-get-handler.ts`.
