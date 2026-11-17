# Software System Setup Pipeline — plan (draft for discussion)

Status: **Proposed** · 2026-11-13 · Spans `code-control`, `code-control-express-server`, `code-generator-storage-server`

## Goal

After a software system is created in Code Control, the operator pastes a brain dump of what the app is. Code Control then:

1. Creates the standard repos from templates (default: web, api-express, storage-express, dispatcher web, dispatcher-express; opt-in: console, mobile).
2. Runs an AI call that proposes the **minimum** set of database tables needed for the app to function (no logs, monitoring, audit, analytics).
3. Lets the operator review, revise (more AI calls), and approve the proposal.
4. Renders the approved proposal into model files (`src/model/{entity}.ts`), identical across web, api-express and storage-express (per ADR 009).
5. *(Next phase, same pipeline)* Renders storage migrations + data functions, express data wrappers + CRUD routes, web `src/api/{entity}/`, dispatcher catalog/config, and commits them to the new repos.

Later phases (not in this plan's first cut): tables + filters, create/edit UX, detail pages, console, mobile.

## Core design decision: AI decides *what*, templates decide *how*

Every generated repo follows the same pattern (see `~/github/estimate-and-proposals`: `src/model/estimate.ts`, `src/data/estimates/`, `migrations/00N_*.sql`, web `src/api/estimates/`). So:

- **AI output = a structured data-model proposal (JSON Schema–constrained)**, not source files.
- **Code renders every file deterministically** from the approved proposal: model types, migrations, data functions, express wrappers, web API clients, dispatcher endpoint seeds.

Why: same input → same files; no hallucinated imports or drift from the conventions; cheap to re-render after edits; testable with fixtures. The model's judgment is spent where it matters (which tables, which fields, what's out of scope). If we later want AI-written code (e.g. custom business logic), it becomes a separate, clearly-scoped call.

## AI calls

All calls follow the my-ops-tracker audited pattern (`my-ops-tracker-express-server/.claude/skills/ai-prompt-audit/SKILL.md`): managed Anthropic client, per-prompt model config, `generateStructuredCompletion` with a JSON Schema, audit rows before/after, run events, normalize-in-code, deterministic fallback on failure.

| # | Prompt key | When | Input | Output |
|---|---|---|---|---|
| 1 | `data_model_propose` | After repos are created (or in parallel — it doesn't depend on them) | system name, description, customer name/industry (from CRM), brain dump | `DataModelProposal` |
| 2 | `data_model_revise` | Operator clicks **Revise** with feedback (repeatable) | current proposal JSON + feedback + original brain dump | `DataModelProposal` (new version) |
| — | *(no AI)* | Approve | approved proposal (possibly hand-edited) | rendered model files, then later all CRUD files |

Optional later call: `data_model_ux_hints` (which fields are list columns / filters / detail-only) — or fold these flags into call #1's schema now (recommended; see schema).

### Model + request settings

- Model: `claude-opus-5-5` (current default), adaptive thinking, `output_config: { effort: "high", format: { type: "json_schema", schema } }`. Schema design is judgment-heavy and runs a handful of times per project, so cost is small (~$0.20–0.50 per call at $4/$20 per MTok, thinking included). my-ops-tracker uses `claude-haiku-4-5` for high-volume extraction; the trade-off is different here. Keep the model in `model-config.ts` so it's one-line to change.
- **Server-side refusal fallback on** by default: beta `server-side-fallback-2026-07-01` with `fallbacks: "default"`.
- **Stream** and use `.finalMessage()` (`max_tokens` ~32000) so long thinking doesn't hit HTTP timeouts.
- No `temperature` (rejected on current models), no prefill.
- Port `generateStructuredCompletion` from my-ops-tracker and extend it with `thinking`, `effort`, streaming, and the fallback beta. Keep the `StructuredCompletionError` contract (`max_tokens`, `refusal`, invalid JSON).

### `DataModelProposal` schema (call #1 and #2)

```ts
type DataModelProposal = {
  summary: string;                       // one paragraph: what the app does, as understood
  entities: Array<{
    table_name: string;                  // snake_case plural, e.g. "work_orders"
    singular_name: string;               // "work_order" → model file + folder names
    description: string;
    why_needed: string;                  // ties back to the brain dump
    fields: Array<{
      name: string;                      // snake_case; id/created_at/updated_at are added by code, never by the model
      type: 'text' | 'integer' | 'cents' | 'numeric' | 'boolean' | 'date' | 'timestamptz' | 'uuid' | 'jsonb' | 'enum';
      nullable: boolean;
      enum_values: string[];             // [] unless type = enum
      references_table: string | null;   // FK target table_name (must be in entities, or an allowed external like "crm_customers")
      on_delete: 'cascade' | 'set_null' | 'restrict' | null;
      unique: boolean;
      description: string;
      ui: { list_column: boolean; filter: boolean; required_on_create: boolean };
    }>;
  }>;
  deliberately_excluded: Array<{ name: string; reason: string }>;  // logs, audit, analytics… shows the model's restraint
  open_questions: string[];              // things the operator should decide
};
```

All objects `additionalProperties: false`, all properties `required` (nullable where optional) — the structured-outputs requirement.

### Prompt rules (system prompt)

- Propose the **smallest** set of tables that lets the app's core workflow function end to end. Typical result: 2–8 tables.
- Exclude unless the brain dump makes them core: logs, audit trails, analytics, monitoring, notifications, settings/preferences, feature flags, file storage metadata, users/auth (auth is handled outside the app DB).
- Customers come from the CRM (ops-tracker); reference them by `customer_id uuid` with no FK (matches Code Control's hybrid CRM, ADR 010).
- Money is `cents` (integer), status fields are `enum`, timestamps are `timestamptz`.
- Do not include `id`, `created_at`, `updated_at`.
- Put anything uncertain in `open_questions` instead of guessing.
- Inputs go in the user message as JSON (`{ system: {...}, customer: {...}, brain_dump: "..." }`); for revise, the current proposal JSON plus `feedback`.

### Data-model conventions pack (what the AI is taught)

The proposal is only as good as what the model knows about *our* tables. A survey of 12 storage repos (2026-11-13) shows strong defaults but real drift: money as `_cents` vs `numeric`, soft delete as `is_active` vs `deleted_at` vs none, `varchar(n)`/pg enums only in older repos (Code Control itself included). Without a curated pack the model will copy that drift or invent its own.

Single source: `code-control-express-server/conventions/data-model/` (versioned; each proposal records `conventions_version`; the renderer copies the ADR into every generated storage repo).

| File | Purpose |
|---|---|
| `001-data-model-conventions.md` | ADR: standard columns, naming, types, FKs/on-delete, enums, money, soft delete, ordering, when jsonb is allowed, indexes — each rule with do/don't/why and a rule id |
| `type-vocabulary.json` | allowed field types → SQL + TS + defaults. Feeds the prompt, the JSON Schema `type` enum, and the renderer, so they can't diverge |
| `anti-patterns.md` | what we never use, with the replacement (users/auth tables, audit/log tables, `created_by`, `tenant_id`, pg enums, `varchar(n)`, serial ids, catch-all `metadata jsonb`, …) |
| `examples/` | 3–5 golden tables from real projects, cleaned to current rules: `{table}.sql`, `{entity}.ts`, `notes.md` |
| `few-shot/` | 2–3 real brain dump → approved proposal pairs (e.g. estimate-and-proposals, my-ops-tracker) |

Enforcement, in four layers:

1. **Prompt** — the whole pack goes in the system prompt. It's static, so it's prompt-cached after the first call.
2. **Schema** — the model can only pick types from `type-vocabulary.json`; standard columns and soft delete are table-level flags that code expands. It cannot output `varchar(255)` or a serial id.
3. **Lint** — `lint-data-model-proposal.ts` checks every rule id after normalization. Violations show in the review UI, and one automatic `data_model_revise` pass runs with the violations as feedback.
4. **Eval** — brain dumps for existing projects, scored against the tables actually built (zero lint violations, table overlap, no excluded categories).

Building it is a one-time research step, not something the model redoes per call: an inventory script across all storage repos → operator decides the inconsistent conventions → draft ADR, vocabulary and examples → eval → iterate the prompt. Later option: retrieve the most similar past project's tables as an extra example.

### Normalize in code (never trust model output)

`normalize-data-model-proposal.ts` (pure, tested by `scripts/verify-data-model-proposal.ts`):

- snake_case all names; strip reserved words (`user`, `order`, `group`…) by renaming (`app_users`, `orders` ok, etc.) and record a warning.
- drop `id`/`created_at`/`updated_at` if the model added them; dedupe fields and tables.
- every `references_table` must exist in `entities` or the allowed-externals list; otherwise null it and add a warning.
- `enum` with empty `enum_values` → `text`; non-enum with values → clear them.
- cap table count (e.g. 12) and field count per table (e.g. 30); overflow → warning.
- topologically sort entities by FK so migrations apply in order; cycles → break the latest FK and warn.

Warnings are stored with the proposal and shown in the review UI.

### Failure handling

- AI failure on propose → run moves to `proposal_failed`, operator can **Retry** or **Start blank** (empty proposal edited by hand). No heuristic fallback for schema design; a bad guess is worse than an empty editor.
- Revise failure → keep the previous version; show the error inline.

## Orchestration: an async setup run

Creating repos + an AI call with thinking takes 30–120s, which is too long for one HTTP request. Use a persisted **setup run** (same shape as brain-dump runs) that the web polls.

```text
POST setup-run (brain dump, repo roles)
  → intake_saved
  → repos_creating        (per repo: create from template, idempotent by name)
  → repos_created
  → proposal_running      (AI #1)
  → proposal_ready        ← waits for operator
       ├ revise → proposal_running (AI #2) → proposal_ready (version+1)
       └ approve
  → files_rendering       (model files; later all CRUD files)
  → files_ready           ← operator previews
  → files_committing      (GitHub Git Data API, per repo)
  → done
any step → failed (error_message, failed_step) → POST retry resumes at failed_step
```

- Every step is idempotent and its result is stored before advancing, so a crash, restart, or laptop sleep resumes cleanly.
- Runner: in-process async in express (fire-and-forget after the `202`), guarded by a per-run lock (`status` compare-and-set in storage) so double clicks don't double-run.
- **Where express runs matters**: if it runs on the laptop and the laptop sleeps mid-run, the step fails and **Retry** resumes it. That's acceptable for now; moving the runner to the studio is a later option.
- Only short storage writes go through the gateway (10s timeout is fine). The AI call is express → Anthropic directly.

Events: each step writes `setup_run_events` rows (`type`, `level`, `message`, `details`, `duration_ms`), shown as a live progress list in the web.

## Repo provisioning

Today: `src/services/software-system-setup/config.ts` knows 4 templates (`express`, `python`, `nextjs`, `react-native`); repo rows have `repo_type` only.

Changes:

1. **Add a `role` column** to `software_system_repos` — `repo_type: nextjs` can't tell web vs console vs dispatcher web apart. Roles mirror the luckee-hub registry: `web`, `console`, `express`, `storage`, `dispatcher-web`, `dispatcher`, `mobile`. (`repo_type` has no CHECK constraint, so new types need no constraint migration.)
2. **Role → template config** (env + naming), following the registry's naming:

| Role | Default | repo_type | Template env | Name pattern |
|---|---|---|---|---|
| web | ✅ | nextjs | `GITHUB_TEMPLATE_WEB` (exists) | `{slug}-web` |
| express (api) | ✅ | express | `GITHUB_TEMPLATE_EXPRESS` (exists) | `{slug}-express-server` |
| storage | ✅ | storage-express | `GITHUB_TEMPLATE_STORAGE_EXPRESS` **(new)** | `{slug}-storage-express-server` |
| dispatcher (express) | ✅ | express | `GITHUB_TEMPLATE_DISPATCHER_EXPRESS` **(new)** | `{slug}-express-dispatcher-server` |
| dispatcher-web | ✅ | nextjs | `GITHUB_TEMPLATE_DISPATCHER_WEB` **(new)** | `{slug}-dispatcher-web` |
| console | ☐ | nextjs | `GITHUB_TEMPLATE_CONSOLE` **(new)** | `{slug}-console` |
| mobile | ☐ | react-native | `GITHUB_TEMPLATE_REACT_NATIVE` (exists) | `{slug}-react-native` |

3. **Missing templates are a prerequisite.** `~/github/templates` has express, nextjs, python, react-native only. Candidates to promote into GitHub template repos: storage ← `estimate-and-proposals-storage-express-server` (stripped of estimates); dispatcher-express ← `code-commit-summaries-express-dispatcher-server` (the estimate-and-proposals one is a stub that points there); dispatcher-web and console ← to be decided.
4. Template repos are generated asynchronously by GitHub; poll the new repo's default branch until it has a commit before committing generated files.
5. Generalize `processCreateRepoFromTemplate` to take a role; the setup run calls it once per selected role. The existing per-type routes stay for the manual repo modals.

## Data in Code Control storage (new migrations 097+)

Following ADR 009 (table → `src/data/{table}/` in storage, same-name wrapper in express; operation whitelist comes from the data barrels):

| Table | Purpose |
|---|---|
| `software_system_intakes` | brain dump text per system (`software_system_id`, `message`, `created_at`) |
| `software_system_setup_runs` | `status`, `failed_step`, `error_message`, `repo_roles text[]`, `intake_id`, `approved_proposal_id` |
| `software_system_setup_run_events` | progress log per run |
| `data_model_proposals` | `run_id`, `version`, `source` (`ai_propose`/`ai_revise`/`manual`), `status` (`proposed`/`approved`/`superseded`), `proposal_json`, `warnings jsonb`, `feedback`, `exchange_id` |
| `generated_file_sets` | `run_id`, `proposal_id`, `repo_role`, `files jsonb` (`path`, `sha256`, size), `branch`, `commit_sha`, `pr_url`, `status` |
| `ai_requests` / `ai_responses` / `ai_exchanges` | generic audit with a `prompt_key` column (one set of tables for every Code Control prompt, unlike my-ops-tracker's per-feature tables) |
| `software_system_repos.role` | new column (backfill from `repo_type`: nextjs→web, express→express, react-native→mobile) |

Also: add the new tables to storage's seed table list (`seed-table-names.ts`), and update `migrations/README.md` + the luckee-hub registry's `expectedTables` for `code-control` (it still lists `customers`/`customer_projects`).

**Code Control's own dispatcher needs no catalog change**: every new storage operation goes through the already-exposed `POST /api/storage/v1/invoke`. Only new non-invoke paths would need `dispatcher_exposed_endpoints` rows.

## Express (code-control-express-server)

New:

- `@anthropic-ai/sdk` dependency, `ANTHROPIC_API_KEY` in `.env`/`.env.example`.
- `src/services/managed/` → `initializeManagedAnthropicClient()` / `getManagedAnthropicClient()` (ADR 004).
- `src/services/ai/` → `model-config.ts`, `generate-structured-completion.ts` (ported + extended).
- `src/services/software-system-setup-runs/` → router, routes, `process-*`, `run-setup-step-*.ts`, `run-data-model-propose-ai.ts`, `run-data-model-revise-ai.ts`, `build-data-model-*-prompt.ts`, `schemas/data-model-proposal-schema.ts`, `normalize-data-model-proposal.ts`, `log-setup-run-event.ts`, `config.ts` (brain dump limit, e.g. 8000 chars).
- `src/services/codegen/` → pure renderers: `render-model-file.ts` (phase 1); later `render-migration.ts`, `render-storage-data-functions.ts`, `render-express-data-wrappers.ts`, `render-express-crud-router.ts`, `render-web-api-client.ts`, `render-dispatcher-endpoint-seed.ts`, `render-dispatcher-services-json.ts`.
- `src/services/github/commit-files-to-repo.ts` → Git Data API (blobs → tree → commit → ref). One commit per repo.
- `src/data/{new tables}/` wrappers.
- `scripts/verify-data-model-proposal.ts`, `scripts/verify-codegen-snapshots.ts` (fixture proposal → expected files).

Endpoints (mounted under `/api/data`):

| Method | Path | Notes |
|---|---|---|
| POST | `/software-systems/:id/setup-runs` | `{ message, repo_roles[] }` → `202 { run_id }` |
| GET | `/software-systems/:id/setup-runs/latest` | for page load / resume |
| GET | `/setup-runs/:runId` | run + repos + latest proposal + events (polled every ~2s while running) |
| POST | `/setup-runs/:runId/retry` | resume at `failed_step` |
| POST | `/setup-runs/:runId/proposals/:proposalId/revise` | `{ feedback }` → AI #2 |
| PUT | `/setup-runs/:runId/proposals/:proposalId` | hand edits → new `manual` version |
| POST | `/setup-runs/:runId/proposals/:proposalId/approve` | → render files |
| GET | `/setup-runs/:runId/files` | rendered preview, grouped by repo |
| POST | `/setup-runs/:runId/commit` | push to repos |

Add them to the API docs catalog (ADR 008).

## Web (code-control)

Following the brain-dump layout in my-ops-tracker-web (`src/packages/brain-dump/`, `src/api/brain-dump/`, run state page-local, not Redux):

- `src/api/software-system-setup-runs/` → `create.ts`, `get.ts`, `get-latest.ts`, `retry.ts`, `revise-proposal.ts`, `update-proposal.ts`, `approve-proposal.ts`, `get-files.ts`, `commit.ts`.
- `src/model/` → `setup-run.ts`, `data-model-proposal.ts` (same shapes as express).
- `src/config/software-system-setup.ts` → brain dump limit, default roles, poll interval.
- `src/packages/software-system-detail-page/setup/`:
  - `intake/` — brain-dump textarea + character counter, repo-role checkboxes (5 checked, console + mobile unchecked), **Start setup**.
  - `progress/` — step list fed by run events; error + **Retry**.
  - `proposal/` — table cards (fields, types, FK, why-needed), *deliberately excluded* + *open questions* panels, warnings banner, inline field edits, feedback box + **Revise**, version switcher, **Approve**.
  - `files/` — per-repo file tree + read-only code viewer, **Commit to repos**.
- After creating a system, route straight to its detail page with the Setup section open.

## Generated-project output (phase 2, rendered from the approved proposal)

Per entity `{e}` / table `{t}`:

| Repo | Files |
|---|---|
| storage | `migrations/00N_{t}.sql` (+ `update_updated_at` trigger, indexes on FKs and filter fields), `src/model/{e}.ts`, `src/data/{t}/{get-all,get-by-id,create,update,delete}-{e}.ts` + barrel (auto-whitelisted for invoke), `migrations/0NN_dispatcher_exposed_endpoints.sql` seeding health/meta/invoke |
| express | `src/model/{e}.ts`, `src/data/{t}/*` invoke wrappers, `src/services/{t}/` router + handlers + `process-*` for CRUD, canonical-data client (gateway/direct modes, copied from Code Control) |
| web | `src/model/{e}.ts`, `src/api/{t}/{list,get,create,update,delete}.ts`, `src/api/config.ts` |
| dispatcher-express | `dispatcher.services.json` (storage + express upstreams, ports), `dispatcher.projects.json`, `.env.example` with gate secret |
| dispatcher-web | catalog/try-it UI config pointing at the dispatcher |

Studio-side registration (manual checklist at first, automated later): `gateway_projects` row on the main gateway (infra Postgres), paired gate secret env, ports allocated from the luckee-hub registry (`validate-port-registry.mjs`), luckee-hub `projects.registry.json` entry.

## Build order

1. **Prereqs** — template repos for storage, dispatcher-express, dispatcher-web (console later); `role` column + backfill; Anthropic managed client + `ai/` helpers in Code Control express.
2. **Storage** — migrations 097+ and data functions for the new tables (deploy to the studio first; express gets `Unknown operation` otherwise).
3. **Express** — setup-run service: intake → repos → AI propose/revise → approve; events; retry.
4. **Web** — setup section: intake, progress, proposal review.
5. **Model-file rendering + preview + commit** (end of the first milestone).
6. **Phase 2 codegen** — migrations, data functions, express CRUD, web API, dispatcher config.
7. **Phase 3** — tables + filters, create/edit UX, detail pages (driven by the `ui` flags captured in step 3), then console/mobile.

## Verification

- `scripts/verify-data-model-proposal.ts` — normalizer cases (reserved words, bad FKs, cycles, dropped standard columns).
- `scripts/verify-codegen-snapshots.ts` — fixture proposal → snapshot files; `tsc --noEmit` on the rendered files inside a scratch copy of each template.
- A small eval set: 6–10 real brain dumps (e.g. estimate-and-proposals, my-ops-tracker, a plumbing scheduler) with expected core tables; check table count, no excluded categories, FK validity. Re-run when the prompt or model changes.
- `npx tsc --noEmit -p .` in all three repos; scratch DB run of new migrations twice (idempotent).

## Open questions

1. **Dispatcher naming** — assumed "dispatcher" = project dispatcher web (Next.js, per on-device-dispatcher ADR 005) and "dispatcher-express" = project dispatcher express server. Correct?
2. **Template sources** — which repos become the storage / dispatcher-express / dispatcher-web / console templates?
3. **Model** — `claude-opus-5-5` (recommended for schema design) or match my-ops-tracker's cheaper Haiku?
4. **Commit target** — commit generated files straight to `main` on the brand-new repos, or a `code-control/initial-data-model` branch + PR?
5. **Runner host** — OK to run setup jobs in the laptop express for now (resume on retry), or should setup runs only execute on the studio?
6. **Customer context** — pull the CRM customer's name/industry/notes into the prompt?
