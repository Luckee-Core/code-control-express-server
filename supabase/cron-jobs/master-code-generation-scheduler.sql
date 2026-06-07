-- ============================================================================
-- Master Code Generation Scheduler
-- Triggers every 10 minutes to process all code generation queues in parallel
-- ============================================================================

-- Drop existing schedule if it exists
SELECT cron.unschedule('master-code-generation-scheduler');

-- Schedule master orchestrator to run every 10 minutes
SELECT cron.schedule(
  'master-code-generation-scheduler',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tht-express-server-production.up.railway.app/api/cron/process-all-queues',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Verify the schedule was created
SELECT * FROM cron.job WHERE jobname = 'master-code-generation-scheduler';
