# 008 – API docs catalog (`/api-docs.json`)

## Status
Accepted

## Context

The QR code Express server exposes health probes, QR generation, and API documentation at `GET /api-docs.json` (JSON) and `GET /docs` (HTML). No OpenAPI or third-party doc tools.

This is an **Express-only** (archetype A) slice: humans browse `/docs` on Express. When a companion Next.js app is added later, it can fetch `/api-docs.json` instead. CRUD-heavy forks may add entity groups via `src/utils/api-docs/buildCrudEntityDocs`; this QR server uses hand-maintained groups only.

## Decision

### 1) Service location
- Catalog and router live in `src/services/api-docs/`.
- Group builders live in `api-docs-catalog.ts`; assembly in `build-api-docs-catalog.ts`.
- Shared response helpers live in `src/utils/http/` (`sendSuccess`, `sendHandlerError`).
- Do **not** place catalog code in `src/data/` (no database access).

### 2) Endpoints
- `GET /api-docs.json` returns `{ success: true, data: ApiDocsCatalog }` via `sendSuccess`.
- `GET /docs` returns self-contained HTML via `renderApiDocsHtml(buildApiDocsCatalog())`.
- Mount `createApiDocsRouter()` in `index.ts` after feature routes, before error middleware.

### 3) Handler rules (fork exception)
- **No Supabase** or managed clients — metadata-only route (exception to ADR 002 step 1).
- Handler: `📥` log → `buildApiDocsCatalog()` → `sendSuccess` → `✅` / `📤` logs; `try/catch` → `sendHandlerError`.
- JSDoc on router factory, handler, and `buildApiDocsCatalog`.

### 4) Catalog maintenance
- Update `api-docs-catalog.ts` in the **same PR** when routes change.
- Paths must match mounts in `index.ts` and `src/services/{feature}/router.ts` exactly.

### 5) Catalog content (QR server)
- First group: **Overview** (name exactly `Overview`, empty `endpoints`, multi-paragraph `description`).
- Second group: **Health** — `GET /` and `GET /api/health` with `{ success: true, data }` examples.
- Third group: **QR Code** — `POST /api/generate-code` with JSON request body and PNG success / JSON error responses.
- Root fields: `version`, `baseUrl`, `responseEnvelope`, `groups` — **no** top-level `title`.
- Note in `responseEnvelope` that QR success returns `image/png` bytes, not JSON.

### 6) Types
- Use `type` (not `interface`) in `src/services/api-docs/types.ts`.

## Consequences
- Catalog drift is manual — treat updates like README edits.
- CRUD forks may extend groups using `src/utils/api-docs/buildCrudEntityDocs` when `/api/data` is added.

## Related
- [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md)
- [006 – Logging & error response standards](./006-logging-and-error-response-standards.md)
