-- ============================================================================
-- 0010_technician_gps_health.sql
-- Adds GPS-health signals to the live-location tables so the dispatch board can
-- distinguish, for a clocked-in tech: streaming live (green) vs. GPS paused
-- (blue) vs. permission denied / device error (red). The phone reports these
-- via presence pings even when it has no new fix. ADDITIVE migration.
--
--   gps_active: false = clocked in but GPS not currently streaming (paused)
--   gps_error : 'permission' | 'unavailable' when the device denied/failed GPS
-- ============================================================================

alter table technician_locations         add column if not exists gps_active boolean not null default true;
alter table technician_locations         add column if not exists gps_error  text;
alter table technician_location_history  add column if not exists gps_active boolean not null default true;
alter table technician_location_history  add column if not exists gps_error  text;
