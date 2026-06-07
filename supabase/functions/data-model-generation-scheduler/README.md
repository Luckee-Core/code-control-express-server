# Data Model Generation Scheduler Setup

This document describes how to set up the cron job and edge function for the data model generation queue.

## Overview

The data model generation scheduler runs every 10 minutes to process queued TypeScript model file generation tasks. It works similarly to the ARD generation scheduler.

## Components

1. **Edge Function**: `supabase/functions/data-model-generation-scheduler/index.ts`
   - Thin wrapper that calls the Express backend endpoint
   - Runs in Supabase edge runtime

2. **Cron Job**: `supabase/cron-jobs/data-model-generation-scheduler.sql`
   - Schedules the edge function to run every 10 minutes using pg_cron
   - Requires service_role key for authorization

3. **Express Endpoint**: `/api/data/data-model-generation-queue/process-due`
   - Queries for due queue items (status = 'queued', scheduled_at <= NOW)
   - For each item: generates TypeScript model file using AI, creates PR, updates status

## Setup Steps

### 1. Deploy Edge Function

```bash
cd /Users/matthewruiz/github/tht/tht-express-server
supabase functions deploy data-model-generation-scheduler
```

### 2. Set Up Cron Job

1. Open your Supabase project's SQL Editor
2. Copy the contents of `supabase/cron-jobs/data-model-generation-scheduler.sql`
3. Replace `YOUR_SERVICE_ROLE_KEY` with your actual service_role key from:
   - Project Settings → API → service_role key
4. Run the SQL script

### 3. Verify Setup

Check that the cron job is running:

```sql
SELECT jobid, jobname, schedule 
FROM cron.job 
WHERE jobname = 'invoke-data-model-generation-scheduler-every-10-min';
```

Check cron job execution history:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'invoke-data-model-generation-scheduler-every-10-min'
)
ORDER BY start_time DESC 
LIMIT 10;
```

## How It Works

1. **Every 10 minutes**, pg_cron triggers the edge function
2. **Edge function** calls Express endpoint: `POST /api/data/data-model-generation-queue/process-due`
3. **Express backend**:
   - Queries `data_model_generation_queue` for due items
   - For each item:
     - Fetches entity and field data
     - Generates TypeScript model file using AI (Cursor API)
     - Creates GitHub PR
     - Updates queue item status to 'completed' or 'failed'
4. **Frontend** polls the queue table to show progress in real-time

## Queue Item Lifecycle

```
queued → processing → completed/failed
```

- **queued**: Item created, waiting to be processed
- **processing**: Currently being generated (AI call in progress)
- **completed**: Successfully generated and PR created
- **failed**: Error occurred, see error_message field

## Troubleshooting

### Cron job not running

Check if pg_cron extension is enabled:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

If not, enable it:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Edge function failing

Check edge function logs:

```bash
supabase functions logs data-model-generation-scheduler
```

### Express endpoint errors

Check Express server logs for errors starting with:
- `🚀 Processing data model queue items...`
- `❌ Failed to process queue item`
- `✅ Successfully processed queue item`

## Related Files

- Database migration: `src/db/migrations/068_data_model_generation_system.sql`
- Express router: `src/data/data-model-generation-queue/router.ts`
- Express service: `src/services/data-model-generation/generate-model-file.ts`
- Frontend UI: `src/packages/project-detail-page/phases/data-model/DataModelQueueTable.tsx`
