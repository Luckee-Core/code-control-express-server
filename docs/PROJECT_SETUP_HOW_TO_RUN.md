# Project setup: create repos from GitHub templates

> **Start here:** [OSS quickstart](./oss-quickstart.md) — full walkthrough including Supabase setup and [Connect your GitHub org](./oss-quickstart.md#connect-github).

What you need so the **Repositories** section on a project can create Express and web repos.

## 1. Database

Run migrations in filename order from `src/db/migrations/`:

1. `000_helpers.sql`
2. `000a_create_customers.sql`
3. `001_workspaces_and_projects.sql`

If upgrading from an older Code Control database that had codegen tables, also run `091_drop_codegen.sql`.

See [`src/db/migrations/README.md`](../src/db/migrations/README.md).

## 2. Environment variables (Express only)

Copy `.env.example` to `.env` in **code-control-express-server**.

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side database access |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Yes | PAT with **repo** scope |
| `GITHUB_TEMPLATE_EXPRESS` | Yes | Express template as `owner/repo` (must be a GitHub **Template repository**) |
| `GITHUB_TEMPLATE_PYTHON` | Yes | Python template as `owner/repo` (must be a GitHub **Template repository**) |
| `GITHUB_TEMPLATE_WEB` | Yes | Web template as `owner/repo` (template repo) |
| `GITHUB_OWNER` | No | Default owner for new repos if different from template owner |
| `GITHUB_ALLOWED_OWNERS` | No | Comma-separated allowlist for the org picker in the web UI |
| `PROJECT_SETUP_REPO_NAME_WEB` | No | Web repo name pattern; default `{slug}-web` |

### GitHub PAT

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic).
2. Enable **repo** scope.
3. Set `GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...` in `.env`.

### Template repositories

1. Mark your Express, Python, and Next.js starter repos as **Template repository** (Settings → General).
2. Set `GITHUB_TEMPLATE_EXPRESS`, `GITHUB_TEMPLATE_PYTHON`, and `GITHUB_TEMPLATE_WEB` to `your-org/repo-name`.

### Web app org picker (optional)

In **code-control** `.env.local`:

```env
NEXT_PUBLIC_GITHUB_ALLOWED_ORGS=your-org,another-org
NEXT_PUBLIC_GITHUB_DEFAULT_ORG=your-org
```

## 3. Checklist

- [ ] Migrations applied on a dedicated Supabase project
- [ ] `GITHUB_PERSONAL_ACCESS_TOKEN` with repo scope
- [ ] Template repos marked as templates
- [ ] `GITHUB_TEMPLATE_EXPRESS`, `GITHUB_TEMPLATE_PYTHON`, and `GITHUB_TEMPLATE_WEB` set
- [ ] Express running on port 3010; web on 3000
- [ ] Create a customer → project → **Create** under Servers (Express or Python) / **Create Web app** or **Link existing repo**
