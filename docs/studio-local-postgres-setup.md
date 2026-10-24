# Studio setup — Code Control

Code Control runs as three processes. Postgres belongs to **storage**, not this API.

| Piece | Repo | Default port (Hub) | Role |
|-------|------|-------------------|------|
| Storage | `code-generator-storage-server` | **3080** | Postgres CRUD over LAN HTTP |
| Express API | `code-control-express-server` | **3012** | GitHub repo setup, HTTP API for the web; CRUD via storage |
| Next.js app | `code-control` | **3013** | UI; proxies `/api/*` to Express |

Deployment overview: [DEPLOYMENT.md](../DEPLOYMENT.md).

## Storage host

```bash
createdb code_control
cd code-generator-storage-server
cp .env.example .env    # DATABASE_URL, STORAGE_DISPATCHER_SECRET, STORAGE_BIND_HOST
npm install
npm run db:apply-migrations
# optional, one-time: npm run db:import-from-supabase (SUPABASE_* in storage .env)
npm run dev
curl -s http://127.0.0.1:3080/api/storage/health
```

## Express host

```bash
cd code-control-express-server
cp .env.example .env    # CODE_CONTROL_STORAGE_URL, CODE_CONTROL_STORAGE_SECRET, PORT=3012, GITHUB_*
npm install
npm run dev
curl -s http://127.0.0.1:3012/api/health
```

Expect `"storage": "ok"` and `"database": "ok"`. GitHub setup: [oss-quickstart → Connect GitHub](./oss-quickstart.md#connect-github).

## Web

```env
CODE_CONTROL_API_URL=http://127.0.0.1:3012
```

Start storage, then Express, then the web app.

## Troubleshooting

`/api/health` on Express always returns **200**; use the body (`storage`, `database`) for readiness. While storage is stopped, the web still loads and shows a banner; `/api/data/*` returns 500 with a clear message. Default storage HTTP timeout from Express is **10s** (`STORAGE_REQUEST_TIMEOUT_MS`).

| Symptom | Fix |
|---------|-----|
| `Loading workspace data...` forever | Express down or wrong `CODE_CONTROL_API_URL` |
| Amber banner, empty lists | Start storage (`code-generator-storage-server`); Hub Run does not start it |
| `storage: "unconfigured"` | Set `CODE_CONTROL_STORAGE_URL` + `CODE_CONTROL_STORAGE_SECRET` (or gateway vars) in Express `.env` |
| `storage: "error"` | Storage not running / unreachable on that URL |
| `database: "error"` | Postgres down on the storage host or wrong `DATABASE_URL` in storage `.env` |
| Import fails on FK | Run `npm run db:apply-migrations` in storage first |

## Security

- Storage port 3080 only from trusted LAN hosts; never expose Postgres 5432.
- The Express API has **no auth by default** — trusted networks only (see [SECURITY.md](../SECURITY.md)).
