-- ============================================================================
-- 0007_photos_files.sql
-- Photos & Files — account-owned media, CompanyCam-style.
--
-- Design rules:
--   • Every file is always owned by an account (account_id, NOT NULL).
--   • Optional FKs (property/lead/job/project/work_order/agreement/equipment)
--     let the SAME file surface in multiple views without duplication.
--   • A file uploaded on a job that belongs to an account + property carries
--     all three IDs, so it appears in the account, property, and job galleries.
--   • category_id links to the company's configured photo categories.
--   • Storage: the binary lives in Supabase Storage (private bucket);
--     storage_path is the object key. Postgres holds only metadata.
--
-- ADDITIVE migration. Depends on: 0001_core_hierarchy, 0002_operational_base,
-- 0006_address_fields (properties).
-- ============================================================================

create table if not exists photos_files (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id)  on delete cascade,
  company_id       uuid not null references companies(id)      on delete cascade,
  location_id      uuid not null references locations(id)      on delete cascade,
  service_area_id  uuid references service_areas(id)           on delete set null,

  -- Master owner — always required
  account_id       uuid not null references customers(id)      on delete cascade,

  -- Optional context links — the same file surfaces in each linked view
  property_id      uuid,    -- future: references properties(id)   on delete set null
  lead_id          uuid references leads(id)                   on delete set null,
  job_id           uuid,    -- future: references jobs(id)         on delete set null
  project_id       uuid,    -- future: references projects(id)     on delete set null
  work_order_id    uuid,    -- future: references work_orders(id)  on delete set null
  agreement_id     uuid,    -- future: references agreements(id)   on delete set null
  equipment_id     uuid,    -- future: references equipment(id)    on delete set null

  -- Configured photo category (Settings → Photo Categories)
  category_id      uuid,    -- future: references photo_categories(id) on delete set null

  file_name        text not null,
  file_type        text not null check (file_type in ('image', 'pdf', 'document', 'video', 'other')),
  storage_path     text not null,           -- Supabase Storage object key (private bucket)
  notes            text,
  tags             text[] not null default '{}',

  uploaded_by      uuid references profiles(id),
  uploaded_at      timestamptz not null default now()
);

-- Index every link so each view's gallery query stays fast.
create index if not exists idx_files_account      on photos_files(account_id);
create index if not exists idx_files_property     on photos_files(property_id);
create index if not exists idx_files_job          on photos_files(job_id);
create index if not exists idx_files_project      on photos_files(project_id);
create index if not exists idx_files_work_order   on photos_files(work_order_id);
create index if not exists idx_files_agreement    on photos_files(agreement_id);
create index if not exists idx_files_equipment    on photos_files(equipment_id);
create index if not exists idx_files_org          on photos_files(organization_id);
create index if not exists idx_files_company      on photos_files(company_id);
create index if not exists idx_files_category     on photos_files(category_id);
create index if not exists idx_files_uploaded_at  on photos_files(uploaded_at desc);
