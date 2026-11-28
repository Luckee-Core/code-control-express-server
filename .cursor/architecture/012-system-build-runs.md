# 012 – Build all (system build runs)

## Status

Accepted.

## Context

An approved data model is delivered one tab at a time: Data model (`model`), API (`crud`), Layout, Tables (`list`), Detail pages, Dashboard, Dispatcher. Each kind refuses to run until the PRs it builds on are merged, so building a new project meant pressing Deliver and merging seven times. "Build all" does that in order on the server.

## Decision

```text
POST /system-build-runs { proposal_id }
  → checks: version approved, no running/paused run for the system, dispatcher plan has no problems
  → run + one step per kind (skipped: no dispatcher for the project type, or no repo for any of its roles)
  → background loop, one step at a time:
      processDeliverDataModel({ kind, autoMerge: true })   (the same code as the tab's Deliver)
      every repo merged → next step · a delivery failed or PR closed → run failed
      a PR left open (auto-merge refused) → step waiting_merge, run paused
  → completed when no step is left
POST /:id/continue → re-runs the stopped step (merged repos are skipped, open PRs retried) and carries on
```

- **No copied delivery logic.** Steps call `processDeliverDataModel`, so prerequisites, rendering, rule checks, branch names and squash-merge stay in `data-model-deliveries/`. Every PR is squash-merged, including the dispatcher registration on the shared main gateway repo.
- **Service:** `src/services/system-build-runs/` (`config` with `BUILD_STEPS`, `plan-system-build-steps`, `run-system-build` with `activeSystemBuildRuns` and `startSystemBuildRun`, `settle-stale-system-build-run`, `record-system-build-event`, `process-*`). Same background pattern as ticket-build planning: `void run().catch(mark failed)`; a run still `running` 30 minutes after its last update with no job in this process is marked failed and can be continued.
- **Cancel** stops between steps; a step already delivering finishes.
- **Log:** every step start, merge, skip, wait and failure is a `system_build_run_events` row (storage ADR 023) with PR links in `detail`.
- **Live progress:** `processDeliverDataModel` takes an optional `onProgress` listener and reports each repo's phase (`queued → checking → rendering → committing → opening_pr → merging`, then `merged`, `unchanged`, `open` or `failed`) with file counts and PR links. `track-step-progress` saves the list on `system_build_run_steps.progress` (storage migration 120) after each move; a failed write is logged and never stops the delivery. The tabs pass no listener.
- **Endpoints:** `/api/data/system-build-runs` (GET ?software_system_id=, POST, GET /:id, POST /:id/continue, POST /:id/cancel). Starts and continues answer 202.

## Consequences

- One running or paused build per software system (storage enforces it).
- The tabs keep working on their own; a run and the tabs read the same `data_model_deliveries` rows.
