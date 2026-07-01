-- ============================================================================
-- 0011_tech_location_retention.sql
-- Retention for technician location history: keep 30 days, purge the rest nightly.
-- Employee location history shouldn't be kept indefinitely (privacy) and the
-- table grows fast (~1k rows/hour per moving tech). A daily pg_cron job trims it.
-- ADDITIVE / operational migration.
-- ============================================================================

create extension if not exists pg_cron;

-- Idempotent: drop a prior schedule before (re)creating it.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge_tech_location_history') then
    perform cron.unschedule('purge_tech_location_history');
  end if;
end $$;

-- Nightly at 03:17 UTC: delete movement history older than 30 days.
select cron.schedule(
  'purge_tech_location_history',
  '17 3 * * *',
  $$delete from technician_location_history where recorded_at < now() - interval '30 days'$$
);
