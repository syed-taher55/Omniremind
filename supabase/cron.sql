-- Minute dispatcher for the free tier.
-- 1. In Supabase, enable the pg_cron and pg_net extensions.
-- 2. Replace YOUR_APP and YOUR_CRON_SECRET.
-- 3. Run this file once.
-- For a lighter load, change the schedule to '*/5 * * * *'.

do $$
begin
  perform cron.unschedule('omniremind-dispatch');
exception
  when others then null;
end $$;

select cron.schedule(
  'omniremind-dispatch',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_APP.vercel.app/api/cron/dispatch',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
