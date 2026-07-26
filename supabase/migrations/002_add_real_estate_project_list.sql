-- ============================================================================
-- Migration 002: Add the real project list
-- Safe to run against the already-live database from schema.sql.
-- Purely additive: uses `on conflict (name) do nothing`, so it never
-- touches, renames, or deletes any existing project, customer, or receipt.
-- The `trg_create_project_sequence` trigger (see schema.sql) fires
-- automatically on each new project row and creates its independent
-- CUST-001 / REC-000001 counters - no manual sequence setup needed.
-- ============================================================================

insert into projects (name, short_code, address, contact_phone)
values
  ('BRAHMAPUTRO ARCH LAKE VIEW TOWER', 'BALVT', null, null),
  ('GOYAILKANDI GARDEN CITY', 'GGC', null, null),
  ('AMLAPARA GARDEN CITY', 'AGC', null, null),
  ('MASKANDA GARDEN CITY', 'MGC', null, null),
  ('RAFIQ UDDIN BHUIYAN TOWER', 'RUBT', null, null),
  ('MASKANDA GARDEN CITY CONSTRUCTION PAYMENT', 'MGCCP', null, null)
on conflict (name) do nothing;
