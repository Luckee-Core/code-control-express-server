# Code Control Express Server

Express API for Code Control: customers, projects, and GitHub repo setup.

Companion web app: [code-control](https://github.com/Luckee-Core/code-control)

Default port **3010**.

## Before you start

**You need:** local Postgres (`DATABASE_URL`), a GitHub PAT, and template repos in **your** GitHub org.

**Studio / Hub:** [docs/studio-local-postgres-setup.md](docs/studio-local-postgres-setup.md) (ports 3012 API, 3013 web).

See [docs/oss-quickstart.md](docs/oss-quickstart.md) → [Connect your GitHub org](docs/oss-quickstart.md#connect-github).

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

```bash
createdb code_control
npm run db:apply-migrations
# optional: npm run db:import-from-supabase
```

See [`src/db/migrations/README.md`](src/db/migrations/README.md) and [studio setup](docs/studio-local-postgres-setup.md).

```bash
curl http://localhost:3010/api/health
```

## Mounted routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| GET, POST | `/api/data/customers` | List / create customers |
| GET, POST, PATCH, DELETE | `/api/data/customers/:id` | Customer CRUD |
| GET, POST | `/api/data/projects` | List / create projects |
| GET, POST, PATCH, DELETE | `/api/data/projects/:id` | Project CRUD |
| GET | `/api/data/project-repos` | List all project repos |
| GET | `/api/data/projects/:id/project-setup/github-orgs` | Allowed GitHub orgs |
| GET | `/api/data/projects/:id/project-setup/repos` | Repos for a project |
| POST | `/api/data/projects/:id/project-setup/create-express-repo` | Create Express repo from template |
| POST | `/api/data/projects/:id/project-setup/create-web-repo` | Create Next.js web repo from template |
| POST | `/api/data/projects/:id/project-setup/create-react-native-repo` | Create React Native repo from template |
| POST | `/api/data/projects/:id/project-setup/link-existing-repo` | Link existing GitHub repo |

## GitHub repo creation

See [docs/oss-quickstart.md](docs/oss-quickstart.md) for the full walkthrough, or [docs/PROJECT_SETUP_HOW_TO_RUN.md](docs/PROJECT_SETUP_HOW_TO_RUN.md) for a focused checklist.

## Docs

- [Studio local Postgres](docs/studio-local-postgres-setup.md) — **start here on your studio Mac**
- [OSS quickstart](docs/oss-quickstart.md) — env + GitHub org setup
- [Wire contract](docs/oss/wire-contract.md) — pairing with the web app
- [SECURITY.md](SECURITY.md) — threat model (no API auth by default)

Architecture ADRs: `.cursor/architecture/`
