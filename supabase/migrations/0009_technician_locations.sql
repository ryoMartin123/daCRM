-- ============================================================================
-- 0009_technician_locations.sql
-- Live technician GPS for the dispatch board. The mobile PWA reports the field
-- tech's location while they're clocked in (whole-shift); the desktop board
-- renders a live marker + a "today's route" breadcrumb. Mirrors lib/tech-
-- tracking/data.ts.
--
-- Two tables: `technician_locations` holds ONE upserted row per tech (the latest
-- fix that drives the live marker); `technician_location_history` appends every
-- fix (the breadcrumb trail). Identity is the tech's full NAME (text) to match
-- jobs.assigned_to / the roster — NOT a uuid FK — because users still live in
-- localStorage as slugs. Same pragmatic, decoupled approach as 0008_jobs.sql.
-- ADDITIVE migration.
-- ============================================================================

-- Self-sufficient guards (idempotent; match 0001/0008) so this applies cleanly
-- even if pasted into the dashboard SQL editor on its own.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Latest position — one row per tech, upserted on tech_name.
-- ----------------------------------------------------------------------------
create table if not exists technician_locations (
  tech_name    text primary key,

  -- Hierarchy (text slugs today; future uuid FKs)
  company_id   text,
  location_id  text,

  -- The fix
  lat          double precision not null,
  lng          double precision not null,
  heading      double precision,           -- degrees clockwise from north
  speed        double precision,           -- metres/second
  accuracy     double precision,           -- metres
  on_duty      boolean not null default true,
  recorded_at  timestamptz not null default now(),

  -- Row bookkeeping (DB-managed)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_tech_loc_company  on technician_locations(company_id);
create index if not exists idx_tech_loc_location on technician_locations(location_id);

drop trigger if exists trg_tech_loc_updated_at on technician_locations;
create trigger trg_tech_loc_updated_at
  before update on technician_locations
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- History — append-only breadcrumb trail.
-- ----------------------------------------------------------------------------
create table if not exists technician_location_history (
  id           bigint generated always as identity primary key,
  tech_name    text not null,
  company_id   text,
  location_id  text,
  lat          double precision not null,
  lng          double precision not null,
  heading      double precision,
  speed        double precision,
  accuracy     double precision,
  on_duty      boolean not null default true,
  recorded_at  timestamptz not null default now()
);

create index if not exists idx_tech_hist_name_time
  on technician_location_history (tech_name, recorded_at desc);

-- ----------------------------------------------------------------------------
-- RLS  ⚠️  DEV-ONLY permissive policy (same as 0008_jobs.sql)
-- ----------------------------------------------------------------------------
-- No real auth yet — the app talks to Postgres with the ANON key — so open full
-- access to anon/authenticated. TODO: when Supabase Auth + memberships land,
-- scope by the tech's identity / location membership.
-- ----------------------------------------------------------------------------
alter table technician_locations enable row level security;
drop policy if exists "dev_tech_loc_all_access" on technician_locations;
create policy "dev_tech_loc_all_access" on technician_locations
  for all to anon, authenticated using (true) with check (true);

alter table technician_location_history enable row level security;
drop policy if exists "dev_tech_hist_all_access" on technician_location_history;
create policy "dev_tech_hist_all_access" on technician_location_history
  for all to anon, authenticated using (true) with check (true);

-- Live marker needs Realtime broadcasts on the latest-position table.
alter publication supabase_realtime add table technician_locations;
