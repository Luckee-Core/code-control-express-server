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
| GET, POST | `/api/data/ticket-builds` | List (`?software_system_id=` or `?ops_ticket_id=`) / start a build for an ops ticket (202, plans in background) |
| GET, PATCH | `/api/data/ticket-builds/:id` | Get (polling: syncs agents and PRs) / edit the shared contract |
| POST | `/api/data/ticket-builds/:id/revise`, `/:id/start` | Re-plan with feedback / approve and start one Cursor agent per repo |
| GET, PATCH | `/api/data/ticket-build-repos` | Repos of a build (`?ticket_build_id=`) / edit one repo's plan or include toggle (`/:id`) |
| GET | `/api/data/ticket-build-ai-exchanges` | AI ledger for a build (`?ticket_build_id=`) |

## Agent runs (PR → conventions → templates)

Three human-gated agents, each with its own run history:

1. **PR agent:** **Update PR** on a delivery (Data access rows) → feedback → proposed edits to that PR only. Approving commits them to the PR branch and creates a convention agent **draft**.
2. **Convention agent:** reads the approved PR change and the whole catalog → proposed convention changes, each with a verdict (`new` / `refines` / `conflicts` / `wrong_scope`). You accept, reject or edit each one. Accepted changes are applied through the change ledger (`convention_changes`), and every affected template repo gets a template agent draft.
3. **Template agent:** one draft collects applied changes, from the convention agent and from manual edits in the Conventions UI, for every template repo they affect. Confirming it edits each affected repo's `codegen/`, scaffold and ADRs and opens one PR per repo (a repo can also come back "no change needed"). Approve merges all of its PRs and checks **convergence**: do the merged templates reproduce the reviewer's PR fix? Deny closes all of them.

**Lifecycle (every agent):** `draft` → confirm → `running` → `needs_review` → `approved` (next draft created) / `rejected` / revise (new version). Drafts never start on their own. A worker resumes `running` runs after a restart and sweeps applied changes into template drafts every minute.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/data/data-model-deliveries/:id/pr-agent-runs` | Update PR: `{ feedback, focus_paths?, run_now? }` |
| GET | `/api/data/agent-runs` | List (`agent`, `status=a,b`, `software_system_id`, `delivery_id`, `root_run_id`) |
| GET | `/api/data/agent-runs/summary` | Open runs per agent (sidebar badges) |
| GET | `/api/data/agent-runs/template-heads` | Each template repo's default-branch commit |
| GET / PATCH | `/api/data/agent-runs/:id` | Detail (lineage, versions, hand-offs, AI calls) / edit a draft |
| POST | `/api/data/agent-runs/:id/{confirm,approve,reject,revise,dismiss,retry}` | Lifecycle actions |
| GET | `/api/data/agent-runs/:id/exchanges/:exchangeId` | One AI call with prompt and response |
| GET | `/api/data/agent-runs/:id/{template-diff,template-file,render-preview}?repo=owner/name` | One template repo's PR views |
| GET | `/api/data/conventions/changes`, `/api/data/conventions/:id/changes` | Convention change ledger |

## Codegen (templates, not hardcoded renderers)

Generated code comes from each role's template repo: `codegen/manifest.json` plus Eta templates, at its default branch head. Code Control only builds the template data (`src/services/codegen/engine/`), and each delivery records `template_repo` + `template_sha`. See `codegen/README.md` in a template repo.

| Env | Purpose |
|-----|---------|
| `GITHUB_TEMPLATE_STORAGE_EXPRESS`, `GITHUB_TEMPLATE_EXPRESS`, `GITHUB_TEMPLATE_WEB` | Template repo per role (`owner/repo`), via `repo_roles.template_env_key` |
| `CODEGEN_TEMPLATES_DIR` | Optional: read templates from local checkouts (`<dir>/<repo name>/codegen`) instead of GitHub |
| `GITHUB_API_URL` | Optional: GitHub REST base (GitHub Enterprise, or a local test double) |

**Dev script:**

- **Agent E2E:** `npx ts-node scripts/agent-e2e/index.ts --templates <dir> --template-repos <dir> --storage <absolute path to the storage repo>` runs the whole PR → convention → template chain against an in-memory GitHub and a scripted Anthropic stand-in. Add `--keep-alive` to leave the stack running for UI testing.

## GitHub repo creation

See [docs/oss-quickstart.md](docs/oss-quickstart.md) for the full walkthrough, or [docs/PROJECT_SETUP_HOW_TO_RUN.md](docs/PROJECT_SETUP_HOW_TO_RUN.md) for a focused checklist.

## Docs

- [DEPLOYMENT.md](DEPLOYMENT.md) — storage / express split, laptop ↔ studio
- [Studio setup](docs/studio-local-postgres-setup.md) — **start here on your studio Mac**
- [OSS quickstart](docs/oss-quickstart.md) — env + GitHub org setup
- [Wire contract](docs/oss/wire-contract.md) — pairing with the web app
- [SECURITY.md](SECURITY.md) — threat model (no API auth by default)

Architecture ADRs: `.cursor/architecture/`
