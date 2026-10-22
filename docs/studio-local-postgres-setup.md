# Studio setup — local Postgres (Code Control)

Use this guide on your **studio Mac** (or any machine where you run Code Control through **Luckee Hub** or standalone). The API stores CRM data in **local Postgres**, not Supabase.

Companion web UI: [code-control](https://github.com/Luckee-Core/code-control) → in-app **Studio setup** page (`/studio-setup`).

---

## What you are setting up

| Piece | Repo | Default port (Hub) | Role |
|-------|------|-------------------|------|
| Express API | `code-control-express-server` | **3012** | Postgres CRUD + GitHub repo setup |
| Next.js app | `code-control` | **3013** | UI; proxies `/api/*` to Express |

Standalone dev (no Hub) often uses **3010** (API) and **3000** (web). Set `PORT` and `CODE_CONTROL_API_URL` to match how you start the servers.

---

## Prerequisites

- **Node.js 20+**
- **PostgreSQL 14+** running on the studio machine  
  - macOS (Homebrew): `brew install postgresql@16` then `brew services start postgresql@16`
- **GitHub PAT** with `repo` scope (only if you use “create repo from template”)
- **Optional — one-time import:** Supabase `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from your old cloud project

---

## Step 1 — Create the database

From any shell on the studio:

```bash
createdb code_control
```

If `createdb` fails with “role postgres does not exist”, use your macOS username (peer auth):

```bash
createdb code_control
# connection string often: postgresql://127.0.0.1:5432/code_control
```

Test:

```bash
psql -d code_control -c "SELECT 1"
```

---

## Step 2 — Configure Express (`code-control-express-server`)

```bash
cd /path/to/code-control-express-server
cp .env.example .env
```

**Required** in `.env`:

```env
DATABASE_URL=postgresql://127.0.0.1:5432/code_control
PORT=3012
```

Use `PORT=3010` instead if you are **not** using Hub’s default ports.

**GitHub** (repo creation): copy PAT and template lines from `.env.example` — see [oss-quickstart → Connect GitHub](./oss-quickstart.md#connect-github).

**Do not** put `DATABASE_URL` in the Next.js app — server only.

---

## Step 3 — Apply schema

```bash
npm install
npm run db:apply-migrations
```

Runs every file in `src/db/migrations/` in filename order (`000_helpers.sql` → … → `091_drop_codegen.sql` on existing THT DBs).

---

## Step 4 — (Optional) Copy data from Supabase

Only if you are moving off hosted Supabase. Add **temporarily** to `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Then:

```bash
npm run db:import-from-supabase
```

You should see counts for customers, projects, and repos. When finished, **remove** the two `SUPABASE_*` lines from `.env` so the server never depends on cloud Postgres again.

Re-running import is safe: rows upsert by `id`.

---

## Step 5 — Start the API

```bash
npm run dev
```

Verify (Hub default):

```bash
curl -s http://127.0.0.1:3012/api/health | jq
```

Expect:

```json
{
  "status": "ok",
  "database": "ok",
  ...
}
```

If `database` is `unconfigured`, set `DATABASE_URL` and restart. If `error`, Postgres is down or the DB does not exist.

Quick data check:

```bash
curl -s http://127.0.0.1:3012/api/data/projects | jq '.count'
```

Should return quickly (milliseconds on local Postgres).

---

## Step 6 — Configure & start the web app (`code-control`)

```bash
cd /path/to/code-control
cp .env.example .env.local
```

Point Next at your API (Hub rewrites `/api/*`):

```env
CODE_CONTROL_API_URL=http://127.0.0.1:3012
```

```bash
npm install
npm run dev
```

Open:

- Hub: [http://127.0.0.1:3013/projects](http://127.0.0.1:3013/projects)
- Standalone: [http://127.0.0.1:3000/projects](http://127.0.0.1:3000/projects)

Use **Studio setup** in the sidebar for a live health check and copy-paste commands.

---

## Luckee Hub notes

- Hub catalog uses API **3012** and web **3013** for Code Control.
- Start **Express before** the web app so `/api/*` proxy and the workspace loader succeed.
- Hub may inject `CODE_CONTROL_API_URL` / `EXPRESS_API_URL` when spawning Next — keep Express `PORT` aligned with that URL.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `Loading workspace data...` forever | API down or wrong proxy URL | Check `curl …/api/health`; fix `CODE_CONTROL_API_URL` / Hub ports |
| `database: "unconfigured"` | Missing `DATABASE_URL` | Set in Express `.env`, restart API |
| `database: "error"` | Postgres not running | `brew services start postgresql@16` (or your install) |
| Import fails on FK | Schema not applied | Run `npm run db:apply-migrations` first |
| Slow queries / timeouts | Still on Supabase | Confirm Express `.env` has `DATABASE_URL` and **no** runtime Supabase usage |
| `createdb` permission errors | Wrong OS user | Use `psql postgres` and `CREATE DATABASE code_control;` |

---

## Security on the studio

- `.env` holds `DATABASE_URL` and GitHub tokens — never commit.
- After import, delete Supabase service-role keys from disk if you no longer need them.
- Code Control API has **no auth by default** — use only on trusted networks (see [SECURITY.md](../SECURITY.md)).

---

## Command cheat sheet

```bash
# Schema
npm run db:apply-migrations

# One-time cloud → local copy
npm run db:import-from-supabase

# Run API (set PORT in .env)
npm run dev
```

Migrations detail: [`src/db/migrations/README.md`](../src/db/migrations/README.md).
