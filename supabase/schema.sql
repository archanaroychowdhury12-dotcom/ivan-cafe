-- =========================================================
-- Food Court Cafe Management System - Supabase Schema
-- =========================================================

-- 1. Create Tables

-- Categories
create table if not exists public.categories (
  id text primary key,
  name text not null,
  emoji text not null default '🍽️',
  sort integer not null default 0,
  created_at timestamptz default now()
);

-- Menu Items
create table if not exists public.menu_items (
  id text primary key,
  category_id text references public.categories(id) on delete set null,
  name text not null,
  description text default '',
  price numeric not null default 0,
  image text default '',
  tags text[] default '{}',
  veg boolean default true,
  popular boolean default false,
  sold_out boolean default false,
  prep_mins integer default 15,
  addon_groups jsonb default '[]'::jsonb,
  created_at bigint not null
);

-- Cafe Tables
create table if not exists public.cafe_tables (
  id text primary key,
  code text not null unique,
  label text not null,
  seats integer default 4,
  zone text default 'Main',
  active boolean default true,
  created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id text primary key,
  code text not null unique,
  table_code text not null,
  customer_name text not null,
  customer_phone text,
  lines jsonb not null default '[]'::jsonb,
  note text,
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  service_amount numeric not null default 0,
  total numeric not null default 0,
  tax_percent numeric not null default 0,
  service_percent numeric not null default 0,
  status text not null default 'CONFIRMED',
  created_at bigint not null,
  updated_at bigint not null,
  timeline jsonb not null default '[]'::jsonb,
  payment_mode text not null default 'COUNTER'
);

-- Staff Calls
create table if not exists public.staff_calls (
  id text primary key,
  table_code text not null,
  reason text not null,
  note text,
  created_at bigint not null,
  resolved boolean not null default false
);

-- Cafe Settings (Single record)
create table if not exists public.settings (
  id text primary key default 'default',
  cafe_name text not null default 'Ivan Food Court & Cafe',
  tagline text default 'Artisanal Coffee & Gourmet Street Kitchen',
  currency text not null default '₹',
  tax_percent numeric not null default 5,
  service_percent numeric not null default 5,
  service_enabled boolean not null default false,
  accepting_orders boolean not null default true,
  address text default 'Station Road, Food Street, Counter #4',
  hours text default '11:00 AM – 11:30 PM • Open all days',
  admin_user text not null default 'admin',
  admin_pass_hash text not null default 'b42e412a45e9eaed0a74f8bb5ecd8990d19324bd1f60f3378b41899bc9dee8dc',
  updated_at timestamptz default now()
);

-- 2. Indexes for fast queries
create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_code on public.orders(code);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_staff_calls_resolved on public.staff_calls(resolved);
create index if not exists idx_staff_calls_created_at on public.staff_calls(created_at desc);

-- 3. Row Level Security (RLS) Configuration
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.cafe_tables enable row level security;
alter table public.orders enable row level security;
alter table public.staff_calls enable row level security;
alter table public.settings enable row level security;

-- Policies allowing full access to anon / public users for kiosk/table QR usage
drop policy if exists "Public access for categories" on public.categories;
create policy "Public access for categories" on public.categories for all using (true) with check (true);

drop policy if exists "Public access for menu_items" on public.menu_items;
create policy "Public access for menu_items" on public.menu_items for all using (true) with check (true);

drop policy if exists "Public access for cafe_tables" on public.cafe_tables;
create policy "Public access for cafe_tables" on public.cafe_tables for all using (true) with check (true);

drop policy if exists "Public access for orders" on public.orders;
create policy "Public access for orders" on public.orders for all using (true) with check (true);

drop policy if exists "Public access for staff_calls" on public.staff_calls;
create policy "Public access for staff_calls" on public.staff_calls for all using (true) with check (true);

drop policy if exists "Public access for settings" on public.settings;
create policy "Public access for settings" on public.settings for all using (true) with check (true);

-- 4. Enable Supabase Realtime for instant updates (KDS, Admin, Order status)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'staff_calls') then
    alter publication supabase_realtime add table public.staff_calls;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'menu_items') then
    alter publication supabase_realtime add table public.menu_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'categories') then
    alter publication supabase_realtime add table public.categories;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'cafe_tables') then
    alter publication supabase_realtime add table public.cafe_tables;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
end $$;

-- 5. Default Settings Row
insert into public.settings (id, cafe_name, tagline, currency, tax_percent, service_percent, service_enabled, accepting_orders, address, hours, admin_user, admin_pass_hash)
values (
  'default',
  'Ivan Food Court & Cafe',
  'Artisanal Coffee & Gourmet Street Kitchen',
  '₹',
  5,
  5,
  false,
  true,
  'Station Road, Food Street, Counter #4',
  '11:00 AM – 11:30 PM • Open all days',
  'admin',
  'b42e412a45e9eaed0a74f8bb5ecd8990d19324bd1f60f3378b41899bc9dee8dc'
)
on conflict (id) do nothing;
