-- ============================================================================
-- 0008_jobs.sql
-- First operational entity migrated off browser localStorage onto Postgres so
-- the desktop CRM and the mobile PWA share ONE source of truth for jobs.
--
-- Pragmatic, decoupled design (see plan): this table MIRRORS the `Job` TypeScript
-- interface in lib/jobs/data.ts. IDs are the app's existing string slugs
-- (`job-<ts>-<rand>`), and the hierarchy/customer references are plain TEXT — NOT
-- uuid foreign keys — because organizations/companies/locations/customers still
-- live in localStorage as slug IDs (org_northstar, co_hvac, cust-...). When those
-- entities also move to Postgres we can add real FKs. For now this lets jobs sync
-- across devices today without first migrating the whole hierarchy.
--
-- Most scalar fields are stored as text on purpose: the app treats scheduledDate
-- ("2026-06-28"), scheduledTime ("14:30"), amounts, and the lifecycle *_at ISO
-- strings as opaque values, so text is lossless and avoids type-coercion bugs.
-- ADDITIVE migration.
-- ============================================================================

-- Self-sufficient guards so this file also applies cleanly if run on its own
-- (e.g. pasted into the dashboard SQL editor) without 0001 having run first.
-- Both are idempotent and match the definitions in 0001_core_hierarchy.sql.
create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists jobs (
  id                   text primary key,

  -- Hierarchy + linkage (text slugs today; future uuid FKs)
  company_id           text,
  location_id          text,
  service_area_id      text,
  project_id           text,
  account_id           text,
  agreement_id         text,
  property_address     text,

  -- Core
  title                text not null default '',
  description          text,
  type                 text not null default 'installation',
  status               text not null default 'new',
  priority             text not null default 'normal',

  -- Scheduling (opaque strings, as the app uses them)
  scheduled_date       text not null default '',
  scheduled_time       text not null default '',
  duration_minutes     integer not null default 120,
  completed_date       text,

  -- Assignment
  assigned_to          text not null default '',
  assigned_to_initials text not null default '',

  -- Money (display strings)
  estimated_amount     text,
  actual_amount        text,

  -- Denormalized for list display
  customer_name        text not null default '',
  customer_initials    text not null default '',
  location_name        text not null default '',

  -- Dispatch metadata
  dispatch_type        text,
  source_module        text,
  source_ref_id        text,

  -- Lifecycle timestamps (ISO strings stamped by the app) + audit trail
  dispatched_at        text,
  en_route_at          text,
  started_at           text,
  completed_at         text,
  status_history       jsonb,

  -- Row bookkeeping (DB-managed)
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Indexes for the common job filters.
create index if not exists idx_jobs_company        on jobs(company_id);
create index if not exists idx_jobs_location       on jobs(location_id);
create index if not exists idx_jobs_project        on jobs(project_id);
create index if not exists idx_jobs_account        on jobs(account_id);
create index if not exists idx_jobs_assigned_to    on jobs(assigned_to);
create index if not exists idx_jobs_scheduled_date on jobs(scheduled_date);

-- Reuse the shared updated_at trigger function defined in 0001_core_hierarchy.sql.
drop trigger if exists trg_jobs_updated_at on jobs;
create trigger trg_jobs_updated_at
  before update on jobs
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS  ⚠️  DEV-ONLY permissive policy
-- ----------------------------------------------------------------------------
-- There is no real auth yet (the app's currentUser is hardcoded and it talks to
-- Postgres with the anon key), so this opens full access to anon/authenticated.
-- TODO: tighten when Supabase Auth + memberships land — scope reads/writes by
--   organization_id in (select organization_id from memberships where user_id = auth.uid())
-- exactly like the pattern scaffolded in 0001/0002.
-- ----------------------------------------------------------------------------
alter table jobs enable row level security;

drop policy if exists "dev_jobs_all_access" on jobs;
create policy "dev_jobs_all_access" on jobs
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Allow Realtime to broadcast row changes on this table.
alter publication supabase_realtime add table jobs;
