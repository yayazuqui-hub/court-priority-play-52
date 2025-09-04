-- Add cron job to clean expired users from queue every 30 minutes
SELECT cron.schedule(
  'queue-cleaner',
  '*/30 * * * *', -- every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://xosczqqblnfdrwkjacxs.supabase.co/functions/v1/queue-cleaner',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc2N6cXFibG5mZHJ3a2phY3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcyODQsImV4cCI6MjA3MTc4MzI4NH0.H51_bCYJawipg85kKnl2s8xnbtucNJetF7jZNTRTl3E"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);