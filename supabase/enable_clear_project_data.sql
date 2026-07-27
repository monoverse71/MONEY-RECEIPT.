-- ============================================================================
-- Enables the "Clear Current Project Data" feature.
-- Run this once in the Supabase SQL Editor.
--
-- Does NOT alter any existing table, column, relationship, or RLS policy.
-- Purely adds one new callable function, following the exact same
-- security-definer pattern already used by next_receipt_number /
-- next_customer_code in schema.sql.
-- ============================================================================

create or replace function clear_project_data(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from projects where id = p_project_id) then
    raise exception 'Unknown project_id: %', p_project_id;
  end if;

  -- Deletion order matches the FK dependency chain exactly:
  -- receipt_items -> receipts -> customers -> project_sequences.
  -- Everything below is filtered by p_project_id, so no other project's
  -- data is ever touched, and the `projects` row itself is never deleted.

  delete from receipt_items
   where receipt_id in (select id from receipts where project_id = p_project_id);

  delete from receipts
   where project_id = p_project_id;

  delete from customers
   where project_id = p_project_id;

  delete from project_sequences
   where project_id = p_project_id;

  -- Recreate this project's sequence row from scratch, so its very next
  -- customer is CUST-001 and its very next receipt is REC-000001 - exactly
  -- like a brand-new project, using the identical numbering logic already
  -- in next_customer_code / next_receipt_number (no numbering logic here
  -- is duplicated or changed).
  insert into project_sequences (project_id, last_customer_number, last_receipt_number)
  values (p_project_id, 0, 0);
end;
$$;

-- Same execute-grant pattern already used for the other RPC functions.
grant execute on function clear_project_data(uuid) to anon, authenticated;
