# Code Control — OSS quickstart

Get Code Control running locally in about 30 minutes. You will set up Supabase first, then connect **your GitHub org** for repository creation.

Companion web app: [code-control](https://github.com/Luckee-Core/code-control)

---

## Before you start

You need:

- Node.js 20+
- A **dedicated Supabase project** (do not reuse production data)
- A **GitHub personal access token** with `repo` scope
- Two **template repositories** in your GitHub org (forks of this pair work fine)

---

## 1. Clone both repos

```bash
git clone https://github.com/Luckee-Core/code-control-express-server.git
git clone https://github.com/Luckee-Core/code-control.git
```

Keep them as sibling folders so the README paths work.

---

## 2. Database (Supabase)

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run migrations **in filename order** from `code-control-express-server/src/db/migrations/`:

   | Order | File |
   |-------|------|
   | 1 | `000_helpers.sql` |
   | 2 | `000a_create_customers.sql` |
   | 3 | `001_workspaces_and_projects.sql` |

3. If you are upgrading an older Code Control database that had codegen tables, also run `091_drop_codegen.sql`.

See [`src/db/migrations/README.md`](../src/db/migrations/README.md) for details.

---

## 3. Environment — Supabase only (CRM works, no GitHub yet)

### Express (`code-control-express-server`)

```bash
cd code-control-express-server
cp .env.example .env
```

Fill in at minimum:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Start the API:

```bash
npm install
npm run dev
```

Verify:

```bash
curl http://localhost:3010/api/health
```

### Web (`code-control`)

```bash
cd ../code-control
cp .env.example .env.local
```

Default `CODE_CONTROL_API_URL=http://127.0.0.1:3010` proxies `/api/*` to Express. Supabase vars in `.env.local` are optional (auth scaffold only; the app opens `/projects` without login).

```bash
npm install
npm run dev
```

Open [http://localhost:3000/customers](http://localhost:3000/customers) and create a customer and project. **Repository creation will not work yet** until you complete the next section.

---

## 4. Connect your GitHub org {#connect-github}

Repository features require a GitHub PAT and template repos in **your** org.

### 4.1 Create a GitHub PAT

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
2. Generate a token with the **repo** scope.
3. If your org uses SSO, authorize the token for that org.
4. Add to Express `.env`:

```env
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
```

### 4.2 Prepare template repositories

Code Control creates new repos from GitHub **template repositories**.

**Option A — Fork the official repos**

1. Fork [code-control-express-server](https://github.com/Luckee-Core/code-control-express-server), [python-server-template](https://github.com/trouthouse-tech/python-server-template), and [code-control](https://github.com/Luckee-Core/code-control) into your org.
2. In each fork: **Settings** → **General** → check **Template repository**.
3. Set in Express `.env`:

```env
GITHUB_TEMPLATE_EXPRESS=your-github-org/code-control-express-server
GITHUB_TEMPLATE_PYTHON=your-github-org/python-server-template
GITHUB_TEMPLATE_WEB=your-github-org/code-control
```

**Option B — Use your own starters**

Mark any Express, Python, and Next.js repos as templates, then point the env vars at them.

### 4.3 Environment reference

| Variable | Repo | Required | Purpose |
|----------|------|----------|---------|
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Express | **Yes** | PAT with `repo` scope |
| `GITHUB_TEMPLATE_EXPRESS` | Express | **Yes** | `owner/repo` — Express template |
| `GITHUB_TEMPLATE_PYTHON` | Express | **Yes** | `owner/repo` — Python server template |
| `GITHUB_TEMPLATE_WEB` | Express | **Yes** | `owner/repo` — web template |
| `GITHUB_OWNER` | Express | No | Default owner if different from template owner |
| `GITHUB_ALLOWED_OWNERS` | Express | No | Comma-separated allowlist (server enforces on create) |
| `PROJECT_SETUP_REPO_NAME_WEB` | Express | No | Web repo name pattern; default `{slug}-web` |
| `NEXT_PUBLIC_GITHUB_ALLOWED_ORGS` | Web | No | Org radio buttons in Repositories UI |
| `NEXT_PUBLIC_GITHUB_DEFAULT_ORG` | Web | No | Pre-selected org in UI |

**Single org (minimum):**

```env
# Express .env
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
GITHUB_TEMPLATE_EXPRESS=your-github-org/code-control-express-server
GITHUB_TEMPLATE_PYTHON=your-github-org/python-server-template
GITHUB_TEMPLATE_WEB=your-github-org/code-control
```

New repos are created under the **template owner** unless `GITHUB_OWNER` overrides it.

**Multiple orgs:**

```env
# Express — server-side allowlist
GITHUB_ALLOWED_OWNERS=your-github-org,client-org

# Web .env.local — org picker (should match allowlist)
NEXT_PUBLIC_GITHUB_ALLOWED_ORGS=your-github-org,client-org
NEXT_PUBLIC_GITHUB_DEFAULT_ORG=your-github-org
```

Restart Express after changing `.env`.

### 4.4 Web org picker (optional)

If you run multiple orgs, set `NEXT_PUBLIC_GITHUB_ALLOWED_ORGS` in `code-control/.env.local` so the Repositories tab shows an org selector. With a single org and no web vars, the API still resolves the default owner from your templates.

---

## 5. Smoke test

1. Open a project → **Repositories**.
2. If multiple orgs are configured, confirm the org picker appears.
3. Click **Create** under Servers, choose Express or Python, and verify the repo exists on GitHub and in the UI.
4. Click **Create Web app** — same check.
5. Click **Add existing repo** — paste a `https://github.com/owner/repo` URL.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `GITHUB_TEMPLATE_EXPRESS is not set` or `GITHUB_TEMPLATE_PYTHON is not set` | Missing or malformed template env in Express `.env` |
| `GITHUB_PERSONAL_ACCESS_TOKEN is not set` | PAT not set or Express not restarted |
| `Invalid GitHub owner` | Requested org not in `GITHUB_ALLOWED_OWNERS` |
| Create fails with 404 from GitHub | Template repo not marked as template, or PAT lacks access |
| Web cannot reach API | Express not running on 3010, or `CODE_CONTROL_API_URL` wrong |
| Customers/projects fail | Migrations not applied, or wrong Supabase keys |

---

## Next steps

- [Wire contract](./oss/wire-contract.md) — env vars, ports, API routes
- [Project setup details](./PROJECT_SETUP_HOW_TO_RUN.md) — focused GitHub checklist
- [Security policy](../SECURITY.md) — threat model (no API auth by default)
