-- ═══════════════════════════════════════════════════════════════════════════════
-- CRUD API GENERATION SCHEDULER CRON JOB
-- ═══════════════════════════════════════════════════════════════════════════════
-- Runs every 10 minutes to process due CRUD API generation queue items
-- This scheduler handles the crud_api_generation_queue table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('invoke-crud-api-generation-scheduler-every-10-min');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Replace YOUR_SERVICE_ROLE_KEY before running in Supabase SQL Editor
-- Get it from: Project Settings → API → service_role key
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT cron.schedule(
  'invoke-crud-api-generation-scheduler-every-10-min',
  '*/10 * * * *', -- Every 10 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://yengzcflcbkhgjwtgubp.supabase.co/functions/v1/crud-api-generation-scheduler',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inllbmd6Y2ZsY2JraGdqd3RndWJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAwOTQ5OCwiZXhwIjoyMDg0NTg1NDk4fQ.oEg0Y67E-z2Dy_328mQjzrutKHBC4ZRHhJHErWgjkmE"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

SELECT * FROM cron.job WHERE jobname = 'invoke-crud-api-generation-scheduler-every-10-min';
