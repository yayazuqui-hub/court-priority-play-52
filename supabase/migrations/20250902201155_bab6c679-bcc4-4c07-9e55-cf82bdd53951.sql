-- Enable necessary extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to check schedules every minute
SELECT cron.schedule(
  'auto-schedule-checker',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://xosczqqblnfdrwkjacxs.supabase.co/functions/v1/schedule-checker',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc2N6cXFibG5mZHJ3a2phY3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcyODQsImV4cCI6MjA3MTc4MzI4NH0.H51_bCYJawipg85kKnl2s8xnbtucNJetF7jZNTRTl3E"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);