# OSS release readiness — Code Control pair

Self-audit against the [release readiness checklist](https://github.com/Luckee-Core/mentorai-server/blob/main/data/open-source/oss-release-readiness-checklist.md) (Pair column).

**Verdict: Ship with debt** — strangers can fork and run locally; a few recommended items remain optional.

## 1. Legal and community

| # | Item | Score |
|---|------|-------|
| 1.1 | LICENSE (MIT, both repos) | pass |
| 1.2 | CONTRIBUTING.md | pass |
| 1.3 | CODE_OF_CONDUCT | N/A (recommended, not added) |
| 1.4 | CHANGELOG | N/A (recommended, not added) |
| 1.5 | No secrets in tracked files | pass |

## 2. Product and documentation

| # | Item | Score |
|---|------|-------|
| 2.1 | README (what, run, architecture) | pass |
| 2.2 | Companion repo + governance links | pass |
| 2.3 | .env.example with comments | pass |
| 2.4 | SECURITY.md | pass (both repos) |
| 2.5 | Threat model | pass |
| 2.6 | Wire contract filled | pass |
| 2.7 | In-app OSS onboarding | partial (Repositories setup banner) |
| 2.8 | Database runbook | pass — `src/db/migrations/` + oss-quickstart |
| 2.9 | API docs catalog | N/A (not in scope) |

## 3. Frontend shape

| # | Item | Score |
|---|------|-------|
| 3.1 | src/packages + thin app | pass |
| 3.2 | Redux manual thunks | pass |
| 3.3 | Styles object pattern | pass |
| 3.4 | ADRs + AGENTS.md | partial (some ADRs reference luckee-web / QR) |
| 3.5 | No dead exports | pass |

## 4. Express shape

| # | Item | Score |
|---|------|-------|
| 4.1 | Router factories + handlers | pass |
| 4.2 | /api/data aggregator | pass |
| 4.3 | CRUD in src/data/ | pass |
| 4.4 | Managed clients at startup | pass |
| 4.5 | Logging + error JSON | pass |
| 4.6 | ADR entity pattern | pass |
| 4.7 | Dev auth bypass | N/A (no auth; documented) |

## 5–6. Security

| # | Item | Score |
|---|------|-------|
| 5.1 | NEXT_PUBLIC_* hygiene | pass |
| 6.2 | Env split | pass |
| 6.4 | Auth or local-only threat model | pass |
| 6.5 | CORS documented | pass |

## 7. Pair contract

| # | Item | Score |
|---|------|-------|
| 7.1 | API URL + port 3010 | pass |
| 7.2 | Health endpoint documented | pass |
| 7.3 | Error JSON shape | pass |
| 7.4 | No service-role in browser | pass |

## 8. CI

| # | Item | Score |
|---|------|-------|
| 8.1 | CI build (+ lint web) | pass |
| 8.2 | Lockfile committed | pass |

## Manual verification

- [ ] Express: `npm run dev` + `curl localhost:3010/api/health`
- [ ] Migrations applied on dedicated Supabase project
- [ ] GitHub PAT + template repos configured — see [oss-quickstart.md](../oss-quickstart.md#connect-github)
- [ ] Web: `npm run dev` → create customer → project → create repo

## Remaining optional polish

- `CODE_OF_CONDUCT.md`
- `CHANGELOG.md` or tagged-release notes
- `/api-docs.json` + web `/docs/api` catalog
- Trim stale luckee-web / QR ADRs in web repo
