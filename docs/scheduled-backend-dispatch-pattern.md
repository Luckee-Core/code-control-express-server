# Scheduled workloads → backend “dispatch” routes — Technical overview

**Location:** Versioned in **tht-express-server** (`docs/`).

**Generic pattern:** a **time-based trigger** (Firebase Scheduler, Supabase `pg_cron`, Cloud Scheduler, etc.) does **not** run heavy business logic inline. It invokes a **single HTTP endpoint** on your **long-lived Node/Express** app (e.g. Railway). That route is a **dispatch**: validate the call, then run an orchestration function that queries your database, applies rules, sends email, updates state, and returns a small JSON summary.

This doc stays **generic**. The **THT** ARD stack below is the working reference. For a **WomenHeart / Firebase** walkthrough (pending-network drip emails, `emailActivity` vs tracking collection, wiring options), see [scheduled-dispatch-firebase-wh.md](./scheduled-dispatch-firebase-wh.md).

---

## Terminology (generic)

| Term | Meaning |
|------|---------|
| **Scheduler** | Whatever wakes up on a cron expression (Firebase `onSchedule`, Supabase cron job, external cron + `curl`, …). |
| **Thin caller** | Minimal code in the scheduler layer: log, `fetch`/`axios` the backend URL, handle HTTP errors. |
| **Dispatch route** | One POST (or GET) route whose sole job is to start a batch job and return counts / status. |
| **Orchestration (`process*`)** | Server-side function that loops entities, checks idempotency, performs side effects, persists tracking rows. |
| **Idempotency / tracking store** | Table or collection that records “we already sent email X for entity Y” so reruns are safe. |

---

## Example mappings

### Reference implementation (THT — this repo)

| Layer | Responsibility | Path / artifact |
|-------|----------------|-----------------|
| Supabase cron | Fires on schedule | `supabase/cron-jobs/ard-generation-scheduler.sql` (`pg_cron` + `net.http_post` to Edge Function URL) |
| Edge Function (thin caller) | `POST` Express with JSON body | `supabase/functions/ard-generation-scheduler/index.ts` |
| Express dispatch route | HTTP entry, call orchestration | `src/data/ard-generation-queue/router.ts` → `POST /process-due` |
| Orchestration | Locking, queue queries, work per item | `src/services/ard-generation/process-queue.ts` → `processARDQueue` |

**Flow in one sentence:** cron hits the Edge Function; the Edge Function `POST`s `${API_BASE_URL}/api/data/ard-generation-queue/process-due`; Express runs `processARDQueue`, which reads/writes `ard_generation_queue` and triggers generation work.

### Target example (WomenHeart — brief)

| Generic | WomenHeart (conceptual / to build) |
|---------|-----------------------------------|
| Scheduler | Firebase `onSchedule` (or external cron hitting a secured HTTPS function) |
| Thin caller | Cloud Function that only calls your backend dispatch URL |
| Dispatch route | e.g. `POST /api/.../support-network-pending-emails/process-due` on the service that holds SendGrid secrets and can query Firestore (or a WH-specific Express/Railway app) |
| Entity | `SupportNetwork` with `status === 'pending'` |
| Tracking | Firestore collection keyed by **`networkId` + `emailCode`** (e.g. `supportNetworkEmails`) for drip idempotency — detail in [scheduled-dispatch-firebase-wh.md](./scheduled-dispatch-firebase-wh.md) |

**Idea:** while a network is pending review, a scheduled sweep sends **1d / 3d / 7d** (or similar) reminder emails to a **narrow** audience (e.g. organizers). Each run checks the tracking collection so the same step is never sent twice. Mass “new network” notifications to all users are **not** part of this pattern.

---

## Architecture patterns (platform)

Recommended layout (matches THT Express style and generalizes well):

1. **Router** — register `POST .../process-due` (or domain-specific name); parse auth/secret; map errors to HTTP status.
2. **`process*` orchestration** — “find all candidates → for each, skip if already done → do work → write tracking.”
3. **Data layer** — small, focused queries/inserts for candidates and tracking rows.
4. **Scheduler** — one file, ~50 lines, calls one URL.

**THT reference files:**

- Thin caller: `supabase/functions/ard-generation-scheduler/index.ts` (uses `API_BASE_URL`, `POST` to `/api/data/ard-generation-queue/process-due`).
- Dispatch: `src/data/ard-generation-queue/router.ts` (`router.post('/process-due', ...)`).
- Orchestration: `src/services/ard-generation/process-queue.ts` (`processARDQueue` — project/repo locking, status transitions, calls `processARDQueueItem`).

---

## HTTP contract (generic template)

| Method | Path (example) | Purpose |
|--------|----------------|---------|
| `POST` | `/api/<domain>/process-due` | Run one sweep of scheduled work; return `{ success, processed, … }`. |

### Request

Often an empty JSON body `{}` is enough. If you add a **shared secret**, use a header both sides agree on, e.g.:

```http
POST /api/your-domain/process-due
Content-Type: application/json
X-Cron-Secret: <shared_secret>

{}
```

**Security note:** the THT `ard-generation-scheduler` Edge Function currently calls Express without an `X-Cron-Secret` in code; production systems should **restrict who can hit dispatch routes** (network allowlist, secret header, or mTLS). Document the rule for your project.

### Success (`200`) — shape (example)

```json
{
  "success": true,
  "processed": 42,
  "triggered": 3,
  "skipped": 39,
  "message": "Processed 3 items"
}
```

Exact fields depend on the job; the important part is a **small, loggable summary**.

---

## How THT’s ARD queue implements “dispatch + orchestration”

1. **Cron** invokes the Supabase Edge Function URL (see `supabase/cron-jobs/ard-generation-scheduler.sql`).
2. **Edge Function** reads `API_BASE_URL` and `POST`s `/api/data/ard-generation-queue/process-due`.
3. **Express** obtains Supabase client, calls `processARDQueue(supabase)`.
4. **`processARDQueue`**:
   - Loads dimension tables (`projects`, `project_repos`).
   - For each project, finds **locked** repos (`status = 'processing'`).
   - For each unlocked project+repo, loads the **first** queued row with `scheduled_at <= now` (or null).
   - Marks the row `processing`, runs `processARDQueueItem`, handles failure by marking `failed`.

The sweep is **state-driven** (queue table + status), not “fire everything on a single create event.” The same idea applies when the backing store is a **sent-log collection** per entity instead of a queue row.

---

## Checklist for new projects

1. **One dispatch route per sweep** — avoid many micro-cron endpoints unless you have a strong reason.
2. **Tracking store** — every outward email or expensive side effect should be deduped by a natural key (entity id + step id).
3. **Anchor time** — document whether “day 1” is calendar days, 24h from UTC `createdAt`, or business days.
4. **Failure behavior** — log and continue other entities; optionally mark rows `failed` with `error_message` (ARD queue does this).
5. **Observability** — structured logs + counts in the HTTP response for quick cron dashboarding.

---

## Related reading in this repo

- Stripe-style overview examples: `docs/stripe-customer-feature-overview.md`, `docs/stripe-connect-account-overview.md` (tone and section structure).
- **Firebase / WomenHeart detail:** [scheduled-dispatch-firebase-wh.md](./scheduled-dispatch-firebase-wh.md).
- ARD orchestration: `src/services/ard-generation/process-queue.ts`.
- ARD dispatch route: `src/data/ard-generation-queue/router.ts`.
- Supabase thin caller: `supabase/functions/ard-generation-scheduler/index.ts`.
- Cron SQL sample: `supabase/cron-jobs/ard-generation-scheduler.sql`.
