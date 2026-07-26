-- ============================================================================
-- Money Receipt System — Supabase Schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. PROJECTS
-- Each project (e.g. "Brahmaputra Arch Lake View Tower") has its own
-- receipt-number sequence and customer-ID sequence.
-- ----------------------------------------------------------------------------
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  short_code    text not null unique,        -- e.g. "BALV", used as prefix if desired
  address       text,
  contact_phone text,
  created_at    timestamptz not null default now()
);

-- Per-project counters. One row per project, updated atomically so two
-- concurrent receipts/customers can never collide on the same number.
create table if not exists project_sequences (
  project_id           uuid primary key references projects(id) on delete cascade,
  last_receipt_number  integer not null default 0,
  last_customer_number integer not null default 0  -- first customer is CUST-001
);

-- Auto-create a sequence row whenever a project is created.
create or replace function fn_create_project_sequence()
returns trigger as $$
begin
  insert into project_sequences (project_id) values (new.id);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_create_project_sequence on projects;
create trigger trg_create_project_sequence
  after insert on projects
  for each row execute function fn_create_project_sequence();

-- ----------------------------------------------------------------------------
-- 2. CUSTOMERS
-- Customer IDs and their data are scoped per project.
-- ----------------------------------------------------------------------------
create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  customer_code text not null,               -- e.g. "CUST-001", unique within project
  name          text not null,
  nid           text,
  mobile        text,
  nominee_name  text,
  nominee_nid   text,
  created_at    timestamptz not null default now(),
  unique (project_id, customer_code)
);

create index if not exists idx_customers_project on customers(project_id);
create index if not exists idx_customers_name on customers using gin (to_tsvector('simple', name));
create index if not exists idx_customers_mobile on customers(mobile);
create index if not exists idx_customers_nid on customers(nid);

-- ----------------------------------------------------------------------------
-- 3. RECEIPTS
-- Receipt numbers are unique per project (never duplicated).
-- ----------------------------------------------------------------------------
create type receipt_status as enum ('draft', 'final', 'cancelled');

create table if not exists receipts (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  customer_id     uuid not null references customers(id) on delete restrict,
  receipt_number  text not null,             -- e.g. "REC-000001"
  receipt_date    date not null default current_date,
  status          receipt_status not null default 'draft',
  note            text default 'All payments are non-refundable and subject to clearance of cheque/transfer.',
  prepared_by     text,
  authorized_by   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (project_id, receipt_number)
);

create index if not exists idx_receipts_project on receipts(project_id);
create index if not exists idx_receipts_customer on receipts(customer_id);
create index if not exists idx_receipts_number on receipts(receipt_number);

create or replace function fn_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_receipts_touch on receipts;
create trigger trg_receipts_touch
  before update on receipts
  for each row execute function fn_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 4. RECEIPT ITEMS (the "Payment Breakdown" table rows)
-- ----------------------------------------------------------------------------
create table if not exists receipt_items (
  id                uuid primary key default gen_random_uuid(),
  receipt_id        uuid not null references receipts(id) on delete cascade,
  sl                integer not null,
  description       text not null,
  payment_method    text not null,           -- Cash, Bank Transfer, Cheque, BEFTN, RTGS, bKash, Nagad, Rocket, Upay, Others
  total_unit_price  numeric(14,2) not null default 0,
  amount_paid       numeric(14,2) not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists idx_receipt_items_receipt on receipt_items(receipt_id);

-- ----------------------------------------------------------------------------
-- 5. ATOMIC NUMBER GENERATORS
-- Row-locked increments so concurrent requests never produce duplicates.
-- ----------------------------------------------------------------------------
create or replace function next_receipt_number(p_project_id uuid)
returns text as $$
declare
  v_next integer;
begin
  update project_sequences
     set last_receipt_number = last_receipt_number + 1
   where project_id = p_project_id
   returning last_receipt_number into v_next;

  if v_next is null then
    raise exception 'Unknown project_id: %', p_project_id;
  end if;

  return 'REC-' || lpad(v_next::text, 6, '0');
end;
$$ language plpgsql;

create or replace function next_customer_code(p_project_id uuid)
returns text as $$
declare
  v_next integer;
begin
  update project_sequences
     set last_customer_number = last_customer_number + 1
   where project_id = p_project_id
   returning last_customer_number into v_next;

  if v_next is null then
    raise exception 'Unknown project_id: %', p_project_id;
  end if;

  return 'CUST-' || lpad(v_next::text, 3, '0');
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- Scaffold policies: any authenticated user can read/write. Tighten this
-- later with per-project staff roles (phase 2).
-- ----------------------------------------------------------------------------
alter table projects enable row level security;
alter table project_sequences enable row level security;
alter table customers enable row level security;
alter table receipts enable row level security;
alter table receipt_items enable row level security;

create policy "Authenticated read projects" on projects
  for select to authenticated using (true);
create policy "Authenticated write projects" on projects
  for all to authenticated using (true) with check (true);

create policy "Authenticated read sequences" on project_sequences
  for select to authenticated using (true);

create policy "Authenticated read customers" on customers
  for select to authenticated using (true);
create policy "Authenticated write customers" on customers
  for all to authenticated using (true) with check (true);

create policy "Authenticated read receipts" on receipts
  for select to authenticated using (true);
create policy "Authenticated write receipts" on receipts
  for all to authenticated using (true) with check (true);

create policy "Authenticated read receipt_items" on receipt_items
  for select to authenticated using (true);
create policy "Authenticated write receipt_items" on receipt_items
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- 7. SEED DATA (the three projects mentioned in the spec)
-- ----------------------------------------------------------------------------
insert into projects (name, short_code, address, contact_phone)
values
  ('Brahmaputra Arch Lake View Tower', 'BALV', 'House #37, Station Road, Dhaka-1205', '+88000-000000'),
  ('Apon Niketon Commercial', 'ANC', 'Apon Niketon, Dhaka', '+88000-000001'),
  ('Apon Niketon Residency', 'ANR', 'Apon Niketon, Dhaka', '+88000-000002')
on conflict (name) do nothing;
