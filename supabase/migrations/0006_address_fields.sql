-- ============================================================================
-- 0006_address_fields.sql
-- Structured address fields — adds Google Places / Address Validation data to
-- customers and (future) properties tables.
--
-- Why: The base schema stored address as free-text. This migration adds
-- structured columns for geocoding, validation, and service area matching.
--
-- ADDITIVE migration — all new columns are nullable so existing rows are
-- unaffected. No existing column is removed or renamed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- customers — add structured address columns
-- ----------------------------------------------------------------------------
alter table customers
  add column if not exists address_line1            text,
  add column if not exists address_line2            text,
  add column if not exists postal_code              text,
  add column if not exists country                  text default 'US',
  add column if not exists formatted_address        text,
  add column if not exists latitude                 numeric(10, 7),
  add column if not exists longitude                numeric(10, 7),
  add column if not exists place_id                 text,
  add column if not exists address_validation_status text
                             check (address_validation_status in (
                               'unvalidated', 'validated', 'inferred',
                               'user_confirmed', 'skipped'
                             ));

-- Index for proximity/territory queries
create index if not exists idx_customers_location_coords
  on customers (latitude, longitude)
  where latitude is not null and longitude is not null;

-- ----------------------------------------------------------------------------
-- properties — create if not already present, with full address columns
-- (When the dedicated properties table is built, run this migration first.)
-- ----------------------------------------------------------------------------
create table if not exists properties (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id)  on delete cascade,
  company_id       uuid not null references companies(id)      on delete cascade,
  location_id      uuid not null references locations(id)      on delete cascade,
  service_area_id  uuid references service_areas(id)           on delete set null,
  account_id       uuid not null references customers(id)      on delete cascade,

  label            text,
  property_type    text not null default 'residential'
                     check (property_type in (
                       'residential', 'commercial', 'industrial', 'multi_family'
                     )),
  status           text not null default 'active'
                     check (status in ('active', 'inactive')),
  is_primary       boolean not null default false,

  -- Structured address
  address_line1    text not null,
  address_line2    text,
  city             text not null,
  state            text not null,
  postal_code      text,
  country          text not null default 'US',
  formatted_address text,
  latitude         numeric(10, 7),
  longitude        numeric(10, 7),
  place_id         text,
  address_validation_status text
                     check (address_validation_status in (
                       'unvalidated', 'validated', 'inferred',
                       'user_confirmed', 'skipped'
                     )),

  -- Physical details
  sqft             integer,
  year_built       integer,
  access_notes     text,

  created_by       uuid references profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_properties_account        on properties(account_id);
create index if not exists idx_properties_org            on properties(organization_id);
create index if not exists idx_properties_service_area   on properties(service_area_id);
create index if not exists idx_properties_location_coords
  on properties (latitude, longitude)
  where latitude is not null and longitude is not null;

create trigger trg_properties_updated_at
  before update on properties
  for each row execute function set_updated_at();
