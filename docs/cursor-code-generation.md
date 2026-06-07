# Cursor Code Generation — Architecture & Ledger

This document covers the full lifecycle of a programmatic code generation run: how a prompt is assembled, how the Cursor Cloud Agents API is called, and how the three-table Supabase ledger tracks every request, agent exchange, and final response.

---

## Overview

When a user triggers code generation from the `tht-backend-panel`, the Express server builds a prompt from stored conventions and examples, launches a Cursor Cloud Agent against a real GitHub repository, polls until the agent finishes, and records the full exchange in Supabase. The result is an auto-created GitHub PR with the generated code.

```
Panel UI
  └─→ Express /api/data/<queue> (trigger endpoint)
        └─→ run*Generation()
              ├─→ buildPrompt()                  (assemble prompt from templates + conventions)
              ├─→ INSERT cursor_generation_requests   (status: pending)
              ├─→ POST https://api.cursor.com/v0/agents  (launch agent)
              ├─→ INSERT cursor_generation_exchanges     (status: running)
              ├─→ pollAgentStatus()              (poll GET /v0/agents/:id every 30s)
              ├─→ INSERT cursor_generation_responses     (pr_url, branch, summary)
              ├─→ UPDATE cursor_generation_exchanges     (status: completed)
              └─→ UPDATE cursor_generation_requests      (status: completed)
```

---

## Generation Entry Points

There are four generation functions, each targeting a different type of code output. All four follow the exact same pipeline and write to the same three ledger tables.

| Function | File | What it generates |
|---|---|---|
| `runARDGeneration` | `src/services/code-generation/ards/run-ard-generation.ts` | `.cursor/` architecture docs (AGENTS.md, READMEs) |
| `runEntityGeneration` | `src/services/code-generation/entities/run-entity-generation.ts` | Data entity model files and migrations |
| `runCrudApiGeneration` | `src/services/code-generation/crud-api/run-crud-api-generation.ts` | Individual CRUD operation files (get, create, update, delete) |
| `runTableNamesConfigGeneration` | `src/services/code-generation/crud-api/run-table-names-config-generation.ts` | Table name config files |

---

## Step-by-Step Pipeline

### 1. Load context from Supabase

Each generator loads the data it needs to build the prompt:

- **Repo** — `project_repos`: provides `repo_url` (used to extract `owner/repo`) and `repo_type` (e.g. `express`, `nextjs`)
- **Task** — `data_entity_generation_tasks` or `crud_api_tasks`: provides `prompt_template` and `output_path_template`
- **Entity** (entity/CRUD generators) — `data_entity` + `data_entity_field`: provides the entity name, table name, and all typed fields
- **Conventions** — `build_conventions`: filtered by `required_conventions_tags` on the task (ARD/entity) or resolved through `build_steps → step_task_categories → convention_task_categories` (CRUD)
- **Examples** — `build_examples`: filtered by `required_examples_tags` on the task

### 2. Build the prompt

A `build*Prompt()` function merges the template with the loaded data using Handlebars-style `{{variable}}` replacement:

**ARD prompt variables:**
| Variable | Value |
|---|---|
| `{{repoName}}` | Repository name extracted from `repo_url` |
| `{{stackType}}` | `repo_type` from the repo record |
| `{{outputPath}}` | `output_path_template` from the task |
| `{{conventions}}` | All matched conventions formatted as `### Name\ncontent` |
| `{{examples}}` | All matched examples as fenced TypeScript blocks |

**Entity prompt** adds: `{{entityName}}`, `{{tableName}}`, `{{fields}}`

**CRUD prompt** adds: `{{entityName}}`, `{{tableName}}`, `{{filePath}}`, `{{operationKey}}`, `{{entity_fields}}`, `{{input_fields}}`

The `output_path_template` also supports `{{entityName}}`, `{{entityNameLower}}`, `{{tableName}}`, `{{timestamp}}` substitutions for dynamic file path targeting.

### 3. Insert `cursor_generation_requests` (status: `pending`)

Before touching the Cursor API, a request record is created as an audit anchor.

```
cursor_generation_requests
  id               UUID (randomUUID)
  project_id       FK → customer projects
  repo_id          FK → project_repos
  entity_id        FK → data_entity (null for ARD generation)
  task_id          FK → the task that defined this generation
  selected_task_id FK → data_entity_selected_tasks (null for ARD/CRUD)
  prompt_text      The fully built prompt string sent to Cursor
  status           'pending'
  created_at / updated_at
```

### 4. Launch the Cursor Cloud Agent

`getCursorClient().launchAgent()` calls `POST https://api.cursor.com/v0/agents` with Basic Auth (`CURSOR_API_KEY`).

```typescript
cursorClient.launchAgent({
  prompt: { text: prompt },
  source: { repository: 'owner/repo', ref: 'main' },
  target: {
    autoCreatePr: true,
    branchName: 'feature/ard-...-<timestamp>',  // or add-entity-..., crud-..., etc.
  },
})
```

Branch naming conventions:
| Generator | Branch pattern |
|---|---|
| ARD | `feature/ard-<task_type>-<timestamp>` |
| Entity | `feature/add-<entity>-<task_type>-<timestamp>` |
| CRUD | `feature/crud-<entity>-<operation>-<timestamp>` |

The Cursor API returns an `Agent` object immediately with an `id` and initial `status: 'CREATING'`.

### 5. Insert `cursor_generation_exchanges` (status: `running`)

Once the agent is launched, the exchange record is created and a start timer is captured.

```
cursor_generation_exchanges
  id               UUID (randomUUID)
  request_id       FK → cursor_generation_requests
  response_id      null (set later on completion)
  agent_id         The Cursor agent ID returned by the API
  model_used       null (set later if available)
  api_calls_count  null (set later)
  duration_seconds null (set later)
  cost_estimate    null (set later)
  repository       'owner/repo'
  branch_ref       'main' (source branch)
  status           'running'
  error_message    null
  created_at / updated_at
```

### 6. Poll agent status

`pollAgentStatus()` calls `GET https://api.cursor.com/v0/agents/:id` on a loop until the agent reaches a terminal state.

```
Poll every 30 seconds
Max wait: 5 minutes (ARD, entity) or 15 minutes (CRUD)

Terminal states:
  FINISHED → proceed to record response
  FAILED   → throw, mark exchange + request as 'failed'
  STOPPED  → throw, mark exchange + request as 'failed'
```

### 7. Insert `cursor_generation_responses`

On `FINISHED`, a response record is created from the final agent state.

```
cursor_generation_responses
  id               UUID (randomUUID)
  pr_url           GitHub PR URL (agent.target.prUrl)
  pr_number        null (not populated by current API response)
  branch_name      The branch Cursor created (agent.target.branchName)
  files_changed    null (not populated by current API response)
  lines_added      null (not populated by current API response)
  lines_removed    null (not populated by current API response)
  agent_summary    The agent's text summary of what it did
  created_at / updated_at
```

### 8. Update `cursor_generation_exchanges` (status: `completed`)

The exchange is closed out with timing and cost data.

```
cursor_generation_exchanges (updated)
  response_id      FK → cursor_generation_responses (now set)
  duration_seconds Wall-clock seconds from agent launch to FINISHED
  api_calls_count  1 + ceil(duration_seconds / 30)
  cost_estimate    api_calls_count × $0.01
  status           'completed'
  updated_at       now
```

### 9. Update `cursor_generation_requests` (status: `completed`)

```
cursor_generation_requests (updated)
  status     'completed'
  updated_at now
```

### 10. Return result

```typescript
{
  success: true,
  prUrl: 'https://github.com/owner/repo/pull/...',
  cursorExchangeId: '<exchange UUID>',
  agentId: '<cursor agent ID>',
  summary: 'Agent summary text...',
}
```

---

## Three-Table Ledger

### Relationship

```
cursor_generation_requests
  1 ──────────────────────── N  cursor_generation_exchanges
                                        │
                                        └── 1 ──── 1  cursor_generation_responses
```

A single request can have multiple exchanges (e.g., if retried). Each exchange links to exactly one response once completed.

### `cursor_generation_requests` — the intent record

Captures **what was asked for** before any agent is launched. This is the audit trail for the prompt itself.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `project_id` | UUID | Customer project |
| `repo_id` | UUID | Target repository |
| `entity_id` | UUID? | Data entity (null for ARD) |
| `task_id` | UUID | Task template that drove this generation |
| `selected_task_id` | UUID? | Selected task tracking record (entity gen only) |
| `prompt_text` | text | Fully assembled prompt sent to Cursor |
| `status` | enum | `pending` → `completed` or `failed` |

### `cursor_generation_exchanges` — the agent run record

Captures **one execution** of a Cursor agent — the runtime metadata and outcome.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `request_id` | UUID | FK → requests |
| `response_id` | UUID? | FK → responses (set on completion) |
| `agent_id` | string | Cursor Cloud Agent ID |
| `model_used` | string? | AI model used (if returned) |
| `api_calls_count` | int | Estimated number of Cursor API calls |
| `duration_seconds` | int | Wall-clock duration |
| `cost_estimate` | float | Estimated cost in USD |
| `repository` | string | `owner/repo` identifier |
| `branch_ref` | string | Source branch (`main`) |
| `status` | enum | `running` → `completed` or `failed` |
| `error_message` | text? | Set if the agent failed or timed out |

### `cursor_generation_responses` — the output record

Captures **what Cursor produced** — the PR link and agent summary.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `pr_url` | text? | GitHub PR URL |
| `pr_number` | int? | PR number (reserved, not currently populated) |
| `branch_name` | text? | Branch Cursor created and pushed to |
| `files_changed` | jsonb? | File list (reserved, not currently populated) |
| `lines_added` | int? | Line count (reserved, not currently populated) |
| `lines_removed` | int? | Line count (reserved, not currently populated) |
| `agent_summary` | text? | Agent's own description of what it built |

---

## Failure Handling

If any step fails after `requestId` or `exchangeId` have been created, the error handler updates both records to `failed` before re-throwing.

```
On error:
  cursor_generation_exchanges  → status: 'failed', error_message: err.message
  cursor_generation_requests   → status: 'failed'
  data_entity_selected_tasks   → status: 'failed', error_message: err.message  (entity gen only)
```

---

## Cursor API Client

**File:** `src/services/cursor/cursor-api-client.ts`  
**Base URL:** `https://api.cursor.com`  
**Auth:** Basic Auth — `Buffer.from('${CURSOR_API_KEY}:').toString('base64')`

| Method | HTTP | Endpoint |
|---|---|---|
| `launchAgent(request)` | POST | `/v0/agents` |
| `getAgent(id)` | GET | `/v0/agents/:id` |
| `getAgentConversation(id)` | GET | `/v0/agents/:id/conversation` |
| `stopAgent(id)` | POST | `/v0/agents/:id/stop` |
| `deleteAgent(id)` | DELETE | `/v0/agents/:id` |

The factory `getCursorClient()` in `src/services/cursor/index.ts` reads `CURSOR_API_KEY` from env and returns a `CursorApiClient` instance. It throws immediately if the key is missing.

---

## Read API (Panel → Express)

The panel reads generation history via these Express routes mounted at `/api/data/cursor-generation`:

| Route | Description |
|---|---|
| `GET /requests?project_id=` | All requests for a project |
| `GET /requests?entity_id=` | All requests for an entity |
| `GET /exchanges?request_id=` | All exchanges for a request |
| `GET /exchanges/:id` | Single exchange |
| `GET /responses/:id` | Single response |

Panel API clients live in `tht-backend-panel/src/api/cursor-generation/`. Redux thunks in `src/store/thunks/cursor-generation/` call those clients and populate `cursorGenerationRequests` and `cursorGenerationResponses` dump slices.
