-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPABASE CRON JOBS SETUP
-- ═══════════════════════════════════════════════════════════════════════════════
-- Before running: Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY
-- Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing cron jobs
SELECT cron.unschedule('invoke-lead-contact-email-scheduler-every-2-min');
SELECT cron.unschedule('invoke-lead-contact-email-scheduler-every-4-min');
SELECT cron.unschedule('invoke-code-generation-scheduler-every-10-min');
SELECT cron.unschedule('invoke-ard-generation-scheduler-every-10-min');
SELECT cron.unschedule('invoke-data-model-generation-scheduler-every-10-min');

-- Code generation scheduler (every 10 min)
SELECT cron.schedule(
  'invoke-code-generation-scheduler-every-10-min',
  '*/10 * * * *',
  $cron$
  DO $body$
  BEGIN
    RAISE NOTICE 'cron: code-generation-scheduler → POST /api/data/code-generation-queue/process-due';
  END $body$;
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/code-generation-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);

-- ARD generation scheduler (every 10 min)
SELECT cron.schedule(
  'invoke-ard-generation-scheduler-every-10-min',
  '*/10 * * * *',
  $cron$
  DO $body$
  BEGIN
    RAISE NOTICE 'cron: ard-generation-scheduler → POST /api/data/ard-generation-queue/process-due';
  END $body$;
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ard-generation-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);

-- Data model generation scheduler (every 10 min)
SELECT cron.schedule(
  'invoke-data-model-generation-scheduler-every-10-min',
  '*/10 * * * *',
  $cron$
  DO $body$
  BEGIN
    RAISE NOTICE 'cron: data-model-generation-scheduler → POST /api/data/data-model-generation-queue/process-due';
  END $body$;
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/data-model-generation-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);

-- Verify
SELECT jobid, jobname, schedule FROM cron.job ORDER BY jobid;
