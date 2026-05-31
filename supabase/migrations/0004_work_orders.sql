-- ============================================================================
-- 0004_work_orders.sql
-- Work Orders — field execution instructions for a Job.
--
-- Design rules:
--   • A work order is always linked to a job (job_id).
--   • It carries the full hierarchy IDs so it filters correctly at every level.
--   • It references a quote/invoice by read-only link — it does not own them.
--   • Checklist is stored as JSONB: [{id, label, completed, required}]
--   • Field notes are added on-site by the assigned technician.
--
-- ADDITIVE migration — safe to run against an existing schema.
-- Depends on: 0001_core_hierarchy, 0002_operational_base
-- ============================================================================

create table if not exists work_orders (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id)  on delete cascade,
  company_id       uuid not null references companies(id)      on delete cascade,
  location_id      uuid not null references locations(id)      on delete cascade,
  service_area_id  uuid references service_areas(id)           on delete set null,

  account_id       uuid references customers(id)               on delete set null,
  property_id      uuid,    -- future: references properties(id) on delete set null
  job_id           uuid,    -- future: references jobs(id)       on delete set null (required in practice)

  -- Assignment
  assigned_to      uuid references profiles(id),

  title            text not null,
  description      text,

  status           text not null default 'pending'
                     check (status in ('pending', 'in_progress', 'completed', 'canceled')),

  scheduled_date   date,
  completed_at     timestamptz,

  -- [{id: uuid, label: text, completed: bool, required: bool}]
  checklist        jsonb not null default '[]',

  -- Notes added by the tech in the field
  field_notes      text,

  -- Read-only reference to financial records — work order does not own these
  quote_id         uuid,    -- future: references quotes(id)   on delete set null
  invoice_id       uuid,    -- future: references invoices(id) on delete set null

  created_by       uuid references profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_work_orders_org          on work_orders(organization_id);
create index if not exists idx_work_orders_company      on work_orders(company_id);
create index if not exists idx_work_orders_location     on work_orders(location_id);
create index if not exists idx_work_orders_account      on work_orders(account_id);
create index if not exists idx_work_orders_job          on work_orders(job_id);
create index if not exists idx_work_orders_assigned_to  on work_orders(assigned_to);

create trigger trg_work_orders_updated_at
  before update on work_orders
  for each row execute function set_updated_at();
