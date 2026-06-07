-- ═══════════════════════════════════════════════════════════════════════════════
-- CODE GENERATION SCHEDULER CRON JOB
-- ═══════════════════════════════════════════════════════════════════════════════
-- Runs every 10 minutes to process due code generation queue items
-- This scheduler handles the code_generation_queue table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('invoke-code-generation-scheduler-every-10-min');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Replace YOUR_SERVICE_ROLE_KEY before running in Supabase SQL Editor
-- Get it from: Project Settings → API → service_role key
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT cron.schedule(
  'invoke-code-generation-scheduler-every-10-min',
  '*/10 * * * *', -- Every 10 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://yengzcflcbkhgjwtgubp.supabase.co/functions/v1/code-generation-scheduler',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

SELECT * FROM cron.job WHERE jobname = 'invoke-code-generation-scheduler-every-10-min';
