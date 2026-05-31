-- ============================================================================
-- 0005_activity_events.sql
-- Activity Events — the customer/account timeline.
--
-- Design rules:
--   • Every event is anchored to account_id (customer).
--   • Optional FKs (contact_id, lead_id, job_id, etc.) link an event to its
--     source record so the same event can be surfaced from multiple detail
--     pages without duplication.
--   • event_type is a fixed enum — new types require a migration, not a free
--     text field, so the UI can safely map types to icons/labels.
--   • metadata stores any extra structured data that does not need its own
--     column (e.g. old_stage/new_stage for lead_stage_changed).
--   • Events are append-only — never updated, only inserted.
--     Hard deletes are allowed only by org admins for GDPR/compliance.
--
-- ADDITIVE migration — safe to run against an existing schema.
-- Depends on: 0001_core_hierarchy, 0002_operational_base
-- ============================================================================

create table if not exists activity_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id)  on delete cascade,
  company_id       uuid not null references companies(id)      on delete cascade,
  location_id      uuid not null references locations(id)      on delete cascade,
  service_area_id  uuid references service_areas(id)           on delete set null,

  -- Always linked to the account
  account_id       uuid not null references customers(id)      on delete cascade,

  -- Optional source record links — event surfaces in each linked view
  property_id      uuid,    -- future: references properties(id)
  contact_id       uuid,    -- future: references contacts(id)
  lead_id          uuid references leads(id)                   on delete set null,
  job_id           uuid,    -- future: references jobs(id)
  project_id       uuid,    -- future: references projects(id)
  work_order_id    uuid,    -- future: references work_orders(id)
  quote_id         uuid,    -- future: references quotes(id)
  invoice_id       uuid,    -- future: references invoices(id)
  agreement_id     uuid,    -- future: references agreements(id)

  event_type       text not null check (event_type in (
    'account_created',
    'contact_added',
    'property_added',
    'lead_created',
    'lead_stage_changed',
    'job_created',
    'job_scheduled',
    'job_completed',
    'work_order_created',
    'quote_created',
    'quote_sent',
    'quote_accepted',
    'invoice_created',
    'payment_received',
    'agreement_created',
    'agreement_renewed',
    'photo_uploaded',
    'file_uploaded',
    'note_added',
    'email_sent',
    'sms_sent',
    'call_logged',
    'task_created',
    'task_completed'
  )),

  event_title      text not null,
  event_description text,

  -- Extra structured data (old/new values, amounts, filenames, etc.)
  metadata         jsonb default '{}',

  created_by       uuid references profiles(id),
  created_at       timestamptz not null default now()
  -- No updated_at — events are append-only
);

create index if not exists idx_activity_account    on activity_events(account_id);
create index if not exists idx_activity_org        on activity_events(organization_id);
create index if not exists idx_activity_company    on activity_events(company_id);
create index if not exists idx_activity_location   on activity_events(location_id);
create index if not exists idx_activity_lead       on activity_events(lead_id);
create index if not exists idx_activity_job        on activity_events(job_id);
create index if not exists idx_activity_type       on activity_events(event_type);
create index if not exists idx_activity_created_at on activity_events(created_at desc);
