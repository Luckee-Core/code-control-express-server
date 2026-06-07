# Code Control Express Server

Express API for Code Control: workspaces, projects, data entities, and codegen queues (ARD, data model, CRUD API).

Extracted from `tht-express-server`. Default port **3010**.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Key endpoints

- `GET /api/health`
- `GET/POST /api/data/workspaces`
- `GET/POST /api/data/projects`
- `GET/POST /api/data/project-repos`
- `POST /api/data/projects/:id/project-setup/repos/express` — create repo from template
- `POST /api/cron/process-all-queues` — codegen orchestrator

Migrations: `src/db/migrations/` (run against a dedicated Supabase project).

Architecture ADRs: `.cursor/architecture/`
