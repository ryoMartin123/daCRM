-- ============================================================================
-- 0003_quotes_invoices.sql
-- Quotes and Invoices — the financial record layer.
--
-- Design rules:
--   • Every quote/invoice is always owned by a customer (account_id).
--   • Optional FKs (property_id, lead_id, project_id, job_id, agreement_id)
--     let the same record surface in multiple context views without copying.
--   • Invoices may be converted from a quote (quote_id) or created manually.
--   • Work orders reference but do not own financial records.
--
-- ADDITIVE migration — safe to run against an existing schema.
-- Depends on: 0001_core_hierarchy, 0002_operational_base
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUOTES
-- ----------------------------------------------------------------------------
create table if not exists quotes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id)  on delete cascade,
  company_id       uuid not null references companies(id)      on delete cascade,
  location_id      uuid not null references locations(id)      on delete cascade,
  service_area_id  uuid references service_areas(id)           on delete set null,

  -- Master owner — always required
  account_id       uuid not null references customers(id)      on delete cascade,

  -- Optional context links — the same quote surfaces in each linked view
  property_id      uuid,   -- future: references properties(id) on delete set null
  lead_id          uuid references leads(id)                   on delete set null,
  project_id       uuid,   -- future: references projects(id)   on delete set null
  job_id           uuid,   -- future: references jobs(id)       on delete set null
  agreement_id     uuid,   -- future: references agreements(id) on delete set null

  quote_number     text not null,
  title            text not null,
  status           text not null default 'draft'
                     check (status in (
                       'draft', 'sent', 'approved', 'declined', 'expired', 'converted'
                     )),

  subtotal         numeric(12,2) not null default 0,
  tax              numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,

  expires_at       timestamptz,
  approved_at      timestamptz,

  created_by       uuid references profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_quotes_org          on quotes(organization_id);
create index if not exists idx_quotes_company      on quotes(company_id);
create index if not exists idx_quotes_location     on quotes(location_id);
create index if not exists idx_quotes_account      on quotes(account_id);
create index if not exists idx_quotes_lead         on quotes(lead_id);
create index if not exists idx_quotes_project      on quotes(project_id);
create index if not exists idx_quotes_job          on quotes(job_id);
create index if not exists idx_quotes_agreement    on quotes(agreement_id);

create trigger trg_quotes_updated_at
  before update on quotes
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- INVOICES
-- ----------------------------------------------------------------------------
create table if not exists invoices (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id)  on delete cascade,
  company_id       uuid not null references companies(id)      on delete cascade,
  location_id      uuid not null references locations(id)      on delete cascade,
  service_area_id  uuid references service_areas(id)           on delete set null,

  -- Master owner — always required
  account_id       uuid not null references customers(id)      on delete cascade,

  -- Optional context links
  property_id      uuid,   -- future: references properties(id) on delete set null
  project_id       uuid,   -- future: references projects(id)   on delete set null
  job_id           uuid,   -- future: references jobs(id)       on delete set null
  agreement_id     uuid,   -- future: references agreements(id) on delete set null

  -- If converted from a quote
  quote_id         uuid references quotes(id)                  on delete set null,

  invoice_number   text not null,
  title            text not null,
  status           text not null default 'draft'
                     check (status in (
                       'draft', 'sent', 'partial', 'paid', 'overdue', 'void'
                     )),

  subtotal         numeric(12,2) not null default 0,
  tax              numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  balance_due      numeric(12,2) not null default 0,

  due_date         date,
  paid_at          timestamptz,

  created_by       uuid references profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_invoices_org         on invoices(organization_id);
create index if not exists idx_invoices_company     on invoices(company_id);
create index if not exists idx_invoices_location    on invoices(location_id);
create index if not exists idx_invoices_account     on invoices(account_id);
create index if not exists idx_invoices_project     on invoices(project_id);
create index if not exists idx_invoices_job         on invoices(job_id);
create index if not exists idx_invoices_agreement   on invoices(agreement_id);
create index if not exists idx_invoices_quote       on invoices(quote_id);

create trigger trg_invoices_updated_at
  before update on invoices
  for each row execute function set_updated_at();
