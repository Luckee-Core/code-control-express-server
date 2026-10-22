# Contributing to Code Control (Express)

Thank you for contributing to the Code Control open-source pair.

## Repositories

| Repo | Role |
|------|------|
| [code-control](https://github.com/Luckee-Core/code-control) | Next.js web app — customers, projects, repositories |
| [code-control-express-server](https://github.com/Luckee-Core/code-control-express-server) | Express API; CRUD via storage |
| [code-generator-storage-server](https://github.com/Luckee-Core/code-generator-storage-server) | Storage Express — owns Postgres, migrations, CRUD SQL |

Changes that touch API contracts should be coordinated across repos. See the [wire contract](./docs/oss/wire-contract.md). New CRUD functions go in **both** `src/data/` trees: SQL in storage, a matching `invokeStorageOperation` wrapper in express ([009](./.cursor/architecture/009-storage-api-split.md)).

## Before you code

1. Read [.cursor/architecture/README.md](./.cursor/architecture/README.md).
2. Read [.cursor/rules/AGENTS.md](./.cursor/rules/AGENTS.md).
3. Follow existing patterns in `src/data/`, `src/services/`, and `src/utils/`.

## Development setup

1. Run `code-generator-storage-server` (Postgres + `npm run db:apply-migrations` there).
2. Copy `.env.example` to `.env` and fill storage + GitHub vars.
3. `npm install` then `npm run dev`.
4. Verify: `curl http://localhost:3010/api/health`

See [docs/oss-quickstart.md](./docs/oss-quickstart.md) for the full walkthrough.

## Pull requests

- Keep PRs focused; one feature or fix per PR when possible.
- Run `npm run build` before opening a PR.
- Update README or docs when behavior, env vars, migrations, or setup steps change.
- Do not commit secrets, `.env` files, or real Supabase or GitHub tokens.

## Questions

Open a GitHub issue for bugs or feature discussion.
