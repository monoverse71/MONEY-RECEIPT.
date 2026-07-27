-- ============================================================================
-- PRODUCTION RESET SCRIPT
-- ----------------------------------------------------------------------------
-- WARNING: This permanently deletes ALL rows from receipt_items, receipts,
-- customers, project_sequences, and projects. Only run this when you intend
-- to wipe every existing demo/test record and start clean for production.
--
-- Does NOT modify any table structure, function, trigger, or RLS policy -
-- it only deletes rows and inserts the 6 production project rows.
--
-- Deletion order avoids foreign key violations:
--   receipt_items -> receipts -> customers -> project_sequences -> projects
-- (each references the one after it, so children are removed first).
--
-- Each project's project_sequences row (last_customer_number = 0,
-- last_receipt_number = 0) is created automatically by the existing
-- trg_create_project_sequence trigger the moment its project row is
-- inserted below - so the first customer generated for every project is
-- CUST-001 and the first receipt is REC-000001, exactly as before.
-- ============================================================================

begin;

-- 1. Delete all existing data, children first.
delete from receipt_items;
delete from receipts;
delete from customers;
delete from project_sequences;
delete from projects;

-- 2. Insert only the 6 production projects. The trigger fires once per row
--    inserted here, automatically creating each project's sequence row.
insert into projects (name, short_code, address, contact_phone)
values
  ('BRAHMAPUTRO ARCH LAKE VIEW TOWER', 'BALVT', null, null),
  ('GOYAILKANDI GARDEN CITY', 'GGC', null, null),
  ('AMLAPARA GARDEN CITY', 'AGC', null, null),
  ('MASKANDA GARDEN CITY', 'MGC', null, null),
  ('RAFIQ UDDIN BHUIYAN TOWER', 'RUBT', null, null),
  ('MASKANDA GARDEN CITY CONSTRUCTION PAYMENT', 'MGCCP', null, null);

commit;

-- ----------------------------------------------------------------------------
-- 3. Verification (read-only) - confirm exactly 6 projects exist, each with
--    its own fresh sequence row starting at 0/0 (so next customer = CUST-001,
--    next receipt = REC-000001 for every project, independently).
-- ----------------------------------------------------------------------------
select
  p.name,
  p.short_code,
  ps.last_customer_number,
  ps.last_receipt_number
from projects p
join project_sequences ps on ps.project_id = p.id
order by p.name;
