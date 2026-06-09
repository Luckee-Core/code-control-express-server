# Project Setup (Create Repos from Template): How to Run

What you need to do so the **Project setup** section in the backend panel works: env variables, migrations, and GitHub template repos.

---

## 1. Database migrations

The feature uses a new table `project_repos` and no longer uses GitHub columns on `projects`.

**Where:** Your Postgres/Supabase database used by tht-express-server.

**Run these in order** (e.g. in Supabase Dashboard → SQL Editor, or your usual migration runner):

1. **041_create_project_repos.sql**  
   Path: `tht-express-server/src/db/migrations/041_create_project_repos.sql`  
   Creates the `project_repos` table (id, workspace_id, project_id, repo_type, name, repo_url, clone_url, etc.).

2. **042_drop_github_columns_from_projects.sql**  
   Path: `tht-express-server/src/db/migrations/042_drop_github_columns_from_projects.sql`  
   Drops `github_repo_url` and `github_clone_url` from `projects` (if they exist).

Copy each file’s contents into the SQL Editor and run it once.

---

## 2. Environment variables

All of these are used by **tht-express-server** (the backend). The panel never sees them.

### Where to put them

- **Local:** In `tht-express-server/.env` (create it if it doesn’t exist; do not commit `.env`).
- **Railway (or other host):** In the service’s environment / Variables tab.

### Variables

| Variable | Required | Where to get it | Example |
|----------|----------|-----------------|---------|
| **GITHUB_PERSONAL_ACCESS_TOKEN** | Yes | GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic). Create a token with scope **repo** (full). | `ghp_xxxx...` |
| **GITHUB_TEMPLATE_EXPRESS** | Yes | Your GitHub repo that is the Express template. Format: `owner/repo`. The repo must be marked as a **Template repository** (repo Settings → General → check “Template repository”). | `myorg/express-server-template` |
| **GITHUB_TEMPLATE_WEB** | Yes | Same idea for the Next.js/web template repo. | `myorg/nextjs-template` |
| **GITHUB_OWNER** | No | GitHub user or org that will **own** the new repos by default. If unset, the code uses the template’s owner. Set if the PAT user differs from the desired owner (e.g. PAT is your user but you want new repos under an org). | `myorg` or your username |
| **GITHUB_ALLOWED_OWNERS** | No | Comma-separated list of GitHub orgs/users allowed when creating repos from the panel. When set, the Repositories tab shows an org dropdown. The request `owner` must be in this list. | `trouthouse-tech,Luckee-Core` |
| **PROJECT_SETUP_REPO_NAME_WEB** | No | Name pattern for the **web** repo. Use `{slug}` for the project name slug. Default: `{slug}-web`. | `{slug}-web` or `{slug}-seller-web` |

### Getting the GitHub token

1. GitHub.com → your profile (top right) → **Settings**.
2. Left sidebar → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
3. **Generate new token (classic)**. Name it (e.g. “THT project setup”), set expiration, and enable the **repo** scope.
4. Copy the token and put it in `.env` as `GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...`.

### Template repos

1. Create (or pick) a repo that will be your **Express** starter (e.g. your standard Express layout).
2. Repo → **Settings** → **General** → check **Template repository**. Save.
3. Do the same for your **Web** (Next.js) repo.
4. Set `GITHUB_TEMPLATE_EXPRESS` and `GITHUB_TEMPLATE_WEB` to `owner/repo` for those two repos.

---

## 3. Quick checklist

- [ ] Run migration **041** (create `project_repos`).
- [ ] Run migration **042** (drop old GitHub columns from `projects`).
- [ ] Create GitHub PAT with **repo** scope; add as **GITHUB_PERSONAL_ACCESS_TOKEN** in `tht-express-server/.env` (and on Railway if you deploy).
- [ ] Mark your Express and Web repos as **Template repository** in GitHub.
- [ ] Set **GITHUB_TEMPLATE_EXPRESS** and **GITHUB_TEMPLATE_WEB** to `owner/repo`.
- [ ] (Optional) Set **GITHUB_OWNER** if new repos should default to a specific user/org.
- [ ] (Optional) Set **GITHUB_ALLOWED_OWNERS** (e.g. `trouthouse-tech,Luckee-Core`) to enable org selection in the panel Repositories tab. The PAT must have repo-creation permission in every listed org.
- [ ] (Optional) Set **PROJECT_SETUP_REPO_NAME_WEB** if you want a different web repo name pattern (e.g. `{slug}-seller-web`).
- [ ] Restart tht-express-server so it picks up env changes.

Then in the panel: open a project → **Project setup** → run **Create Express server** and **Create Web app**. Each creates a new repo from the template and stores it in `project_repos`.
