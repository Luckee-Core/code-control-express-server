# Contributing to Code Control (Express)

Thank you for contributing to the Code Control open-source pair.

## Repositories

| Repo | Role |
|------|------|
| [code-control](https://github.com/Luckee-Core/code-control) | Next.js web app — customers, projects, repositories |
| [code-control-express-server](https://github.com/Luckee-Core/code-control-express-server) | Express API backed by Supabase |

Changes that touch API contracts should be coordinated across both repos. See the [wire contract](./docs/oss/wire-contract.md).

## Before you code

1. Read [.cursor/architecture/README.md](./.cursor/architecture/README.md).
2. Read [.cursor/rules/AGENTS.md](./.cursor/rules/AGENTS.md).
3. Follow existing patterns in `src/data/`, `src/services/`, and `src/utils/`.

## Development setup

1. Copy `.env.example` to `.env` and fill Supabase + GitHub vars.
2. Apply SQL migrations from `src/db/migrations/` in filename order.
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
