# Code Control — Web + Express wire contract

Documented seam between the Next.js web app and the companion Express API.

## 1. Contract summary

| Field | Value |
|-------|-------|
| **Product name** | Code Control |
| **Web repo** | https://github.com/Luckee-Core/code-control |
| **Express repo** | https://github.com/Luckee-Core/code-control-express-server |
| **Default web port** | 3000 |
| **Default API port** | 3010 |
| **API base env (web)** | `CODE_CONTROL_API_URL` (server rewrite); optional `NEXT_PUBLIC_CODE_CONTROL_API_URL` |
| **Health endpoint** | `GET /api/health` |
| **Success JSON** | `{ success: true, data?, count?, message? }` |
| **Error JSON** | `{ success: false, error: string, message? }` |
| **Auth (OSS default)** | None — open API on localhost for trusted local dev |

### Proxy pattern

The web app rewrites `/api/*` to Express via `next.config.ts`. The browser calls same-origin `/api/data/...`; Next.js forwards to `CODE_CONTROL_API_URL` (default `http://127.0.0.1:3010`).

## 2. Environment variables

### 2.1 Web (`code-control`)

| Variable | Client-visible? | Required | Purpose |
|----------|-----------------|----------|---------|
| `CODE_CONTROL_API_URL` | No | No (defaults `http://127.0.0.1:3010`) | Server-side rewrite target for `/api/*` |
| `NEXT_PUBLIC_CODE_CONTROL_API_URL` | **Yes** | No | Optional browser-visible API base |
| `NEXT_PUBLIC_GITHUB_ALLOWED_ORGS` | **Yes** | No | Org radio buttons on Repositories tab |
| `NEXT_PUBLIC_GITHUB_DEFAULT_ORG` | **Yes** | No | Pre-selected org in UI |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | No | Auth scaffold at `/login` only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | No | Auth scaffold at `/login` only |

**Rule:** Never put `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_PERSONAL_ACCESS_TOKEN`, or template repo secrets in `NEXT_PUBLIC_*`.

### 2.2 Express (`code-control-express-server`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | No (default 3010) | Listen port |
| `NODE_ENV` | No | `development` / `production` |
| `SUPABASE_URL` | **Yes** | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-side database access |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | **Yes** (for repo creation) | Classic PAT with `repo` scope |
| `GITHUB_TEMPLATE_EXPRESS` | **Yes** (for Express repo creation) | `owner/repo` — Express template |
| `GITHUB_TEMPLATE_PYTHON` | **Yes** (for Python repo creation) | `owner/repo` — Python template |
| `GITHUB_TEMPLATE_WEB` | **Yes** (for repo creation) | `owner/repo` — web template |
| `GITHUB_OWNER` | No | Default owner if different from template owner |
| `GITHUB_ALLOWED_OWNERS` | No | Comma-separated allowlist for create requests |
| `PROJECT_SETUP_REPO_NAME_WEB` | No | Web repo name pattern; default `{slug}-web` |

Full setup walkthrough: [oss-quickstart.md](../oss-quickstart.md#connect-github).

## 3. HTTP routing map

### Browser → Express (via Next.js rewrite)

```text
/api/data/...
/api/health
```

Resolved to `{CODE_CONTROL_API_URL}/api/data/...` on the server.

### Entity CRUD

| Entity | Path prefix | Notes |
|--------|-------------|-------|
| Customers | `/api/data/customers` | `GET`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Projects | `/api/data/projects` | `GET`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Project repos | `/api/data/project-repos` | `GET` (all repos) |

### Project setup (GitHub)

Mounted at `/api/data/projects/:id/project-setup`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/github-orgs` | Allowed GitHub orgs for repo creation |
| GET | `/repos` | Repos linked to this project |
| POST | `/create-express-repo` | Create Express repo from template |
| POST | `/create-python-repo` | Create Python repo from template |
| POST | `/create-web-repo` | Create web repo from template |
| POST | `/link-existing-repo` | Link existing `github.com/owner/repo` |

Aggregator: `src/data/admin/router.ts`.

**Database:** Supabase Postgres — apply `src/db/migrations/*.sql` in filename order. See [migrations README](../../src/db/migrations/README.md).

## 4. Setup verification

### Express

```bash
cp .env.example .env
# Fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# For repo creation: GITHUB_PERSONAL_ACCESS_TOKEN, GITHUB_TEMPLATE_*
# Apply migrations in src/db/migrations/
npm install
npm run dev
curl http://localhost:3010/api/health
```

### Web

```bash
cp .env.example .env.local
# CODE_CONTROL_API_URL=http://127.0.0.1:3010 (default)
npm install
npm run dev
# Open http://localhost:3000/projects
# Create customer → project → Repositories tab
```

## 5. Governance

OSS release checklist and security audit guides: see [README.md](./README.md).
