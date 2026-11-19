# 011 – Ticket builds (one ticket → plan → one PR per repo)

## Status

Accepted.

## Context

A My Ops Tracker ticket (e.g. "Add food picture feature with calorie estimation") often needs coordinated changes in several repos. Code Control already owns the software systems, repo roles, conventions, GitHub access and a reviewed-AI-then-PR flow (data-model proposals and deliveries). My Ops Tracker used to start one Cursor agent on one repo itself; that moved here.

## Decision

```text
My Ops Tracker ticket → "Build in Code Control" → /ticket-build-start-page?opsTicketId=…
  → create build: read the ops ticket (+ latest ops Research) through the gateway; match the software
    system by repo name (owner ignored); one ticket_build_repos row per system repo (role order)
  → plan (background, Opus): repo file trees + key docs + role conventions → shared contract + per-repo plans
  → review in Code Control: edit contract / repo plans, include or exclude repos, revise with feedback
  → Approve & build: one Cursor Cloud agent per included repo (parallel; autoCreatePR)
  → GET /ticket-builds/:id syncs agents (→ PR url) and PRs (merged/closed); when all agents are done:
    sibling PRs are linked in each PR body, the ops ticket → In review + PR link (once)
```

- **Contract first.** The plan fixes every cross-repo name (tables/columns and migration, storage operations, endpoints and payloads, shared types, web state names) so agents working in parallel agree. Each repo gets its own plan in its own layout and conventions; repos the ticket doesn't touch are marked "no changes". `missing_roles_note` says where work goes when the system lacks a role (e.g. no storage repo).
- **Plan step:** `src/services/ticket-builds/` (`load-ticket-build-context`, `build-plan-*`, `plan-schema`, `normalize-plan`, `run-ticket-build-plan`). Model key `ticket_build_plan` (Opus 5.5, effort high, 32k). Context per included repo: file tree at the default branch head (filtered, ≤ 800 paths), `CLAUDE.md` / `.cursor/rules/AGENTS.md` / `.cursor/architecture/README.md` (≤ 12k chars each), and the role's active conventions from every domain. Every call is recorded in the `ticket_build_ai_*` ledger. A plan running > 15 min with no live job is marked `plan_failed`.
- **Review:** `PATCH /ticket-builds/:id` (contract) and `PATCH /ticket-build-repos/:id` (plan text, include) only while `plan_ready`; `POST /:id/revise` re-plans with feedback using the current edits.
- **Build:** `POST /:id/start` (503 without `CURSOR_API_KEY`, checked first) starts one Cursor Cloud agent per included repo (`src/services/cursor-agents/`, moved from My Ops Tracker). The agent prompt carries the ticket, the contract verbatim, that repo's plan, one-line scopes of the sibling repos, the role's conventions and the PR rules (title `{ticket} ({role})`, body references the ops ticket and build ids).
- **Track:** `GET /ticket-builds/:id` is the polling target: non-blocking Cursor run reads → `opened`/`failed`; opened PRs → `merged`/`closed` via GitHub. `finalize-ticket-build` sets the build status and, once, appends "Related PRs" to each PR body and moves the ops ticket to `in_review` with the web/mobile PR (else the first) through the ops gateway (`updateTicket`).
- **Defaults:** repos are ordered storage, express, python, web, console, mobile, dispatcher, dispatcher-web; dispatcher repos start excluded. A repo without a role gets one inferred from `repo_type` and name.
- **Endpoints:** `/api/data/ticket-builds` (GET ?software_system_id= | ?ops_ticket_id=, POST, GET /:id, PATCH /:id, POST /:id/revise, POST /:id/start), `/api/data/ticket-build-repos` (GET ?ticket_build_id=, PATCH /:id), `/api/data/ticket-build-ai-exchanges` (GET ?ticket_build_id=). Async starts answer 202.

## Consequences

- Builds plan only for repos registered in Code Control; keep software systems' repos and roles current.
- New env: `CURSOR_API_KEY`, `CURSOR_AGENT_MODEL`. My Ops Tracker no longer holds Cursor or GitHub credentials.
