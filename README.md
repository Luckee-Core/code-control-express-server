# Code Control Express Server

Express API for Code Control: customers, projects, and GitHub repo setup.

Companion web app: [code-control](https://github.com/Luckee-Core/code-control)

Default port **3010**.

## Before you start

**You need:** a running [`code-generator-storage-server`](../code-generator-storage-server) (owns Postgres), a GitHub PAT, and template repos in **your** GitHub org.

This API has **no database connection**. CRUD uses `CODE_CONTROL_STORAGE_*` (studio) or `MAIN_GATEWAY_URL` + `DISPATCHER_GATE_SECRET` (laptop). See [DEPLOYMENT.md](DEPLOYMENT.md).

**Studio / Hub:** [docs/studio-local-postgres-setup.md](docs/studio-local-postgres-setup.md) (ports 3080 storage, 3012 API, 3013 web).

See [docs/oss-quickstart.md](docs/oss-quickstart.md) → [Connect your GitHub org](docs/oss-quickstart.md#connect-github).

## Setup

Start storage first (migrations live there), then:

```bash
cp .env.example .env    # CODE_CONTROL_STORAGE_* or MAIN_GATEWAY_URL, GITHUB_*
npm install
npm run dev
curl http://localhost:3010/api/health   # storage: "ok", database: "ok"
```

## Mounted routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check (Storage Express + Postgres status) |
| GET, POST | `/api/data/customers` | List (`?stage=`) / create customers |
| GET | `/api/data/customers/:id` | Get customer |
| GET, POST | `/api/data/projects` | List / create projects |
| GET | `/api/data/projects/customer/:customerId` | Projects for a customer |
| GET, PATCH, DELETE | `/api/data/projects/:id` | Get / update / delete project |
| GET | `/api/data/project-repos` | List all project repos |
| GET | `/api/data/projects/:id/project-setup/github-orgs` | Allowed GitHub orgs |
| GET | `/api/data/projects/:id/project-setup/repos` | Repos for a project |
| POST | `/api/data/projects/:id/project-setup/create-express-repo` | Create Express repo from template |
| POST | `/api/data/projects/:id/project-setup/create-python-repo` | Create Python repo from template |
| POST | `/api/data/projects/:id/project-setup/create-web-repo` | Create Next.js web repo from template |
| POST | `/api/data/projects/:id/project-setup/create-react-native-repo` | Create React Native repo from template |
| POST | `/api/data/projects/:id/project-setup/link-existing-repo` | Link existing GitHub repo |
| POST | `/api/studio-seed/import-to-local` | Export from configured canonical base URL → `STORAGE_IMPORT_TARGET_URL` (default `http://127.0.0.1:3080`) |
| POST | `/api/admin/temp-import-from-laptop-storage` | Temp laptop → studio copy (only when `TEMP_MIGRATION_ENABLED=true`) |

## GitHub repo creation

See [docs/oss-quickstart.md](docs/oss-quickstart.md) for the full walkthrough, or [docs/PROJECT_SETUP_HOW_TO_RUN.md](docs/PROJECT_SETUP_HOW_TO_RUN.md) for a focused checklist.

## Docs

- [DEPLOYMENT.md](DEPLOYMENT.md) — storage / express split, laptop ↔ studio
- [Studio setup](docs/studio-local-postgres-setup.md) — **start here on your studio Mac**
- [OSS quickstart](docs/oss-quickstart.md) — env + GitHub org setup
- [Wire contract](docs/oss/wire-contract.md) — pairing with the web app
- [SECURITY.md](SECURITY.md) — threat model (no API auth by default)

Architecture ADRs: `.cursor/architecture/`
