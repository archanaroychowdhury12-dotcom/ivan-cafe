-- =========================================================
-- Food Court Cafe Management System - Supabase Schema
-- Includes Server-Side Triggers, Audit Logs & Outbox Webhook Queue
-- =========================================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- 1. Create Core Tables

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
  webhook_url text default '',
  webhook_secret text default '',
  webhook_enabled boolean default false,
  auto_print_orders boolean default false,
  updated_at timestamptz default now()
);

-- Ensure columns exist in settings if table was previously created
alter table public.settings add column if not exists webhook_url text default '';
alter table public.settings add column if not exists webhook_secret text default '';
alter table public.settings add column if not exists webhook_enabled boolean default false;
alter table public.settings add column if not exists auto_print_orders boolean default false;

-- =========================================================
-- 2. Audit Trail & Webhook Outbox Queue Tables
-- =========================================================

-- Order Audit Logs Table
create table if not exists public.order_audit_logs (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  order_code text not null,
  action text not null, -- 'INSERT', 'STATUS_CHANGE', 'CANCELLED', 'LINE_UPDATE', 'DELETE'
  old_status text,
  new_status text,
  actor text not null default 'system',
  note text,
  changes jsonb default '{}'::jsonb,
  snapshot jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Webhook Outbox & Retry Queue Table
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, -- 'order.created', 'order.status_changed', 'order.cancelled', 'staff_call.created', 'staff_call.resolved'
  aggregate_id text not null,
  payload jsonb not null,
  status text not null default 'pending', -- 'pending', 'processing', 'delivered', 'failed'
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  next_retry_at timestamptz not null default now(),
  last_error text,
  response_status integer,
  response_body text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 3. Indexes for fast queries & queue processing
-- =========================================================
create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_code on public.orders(code);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_staff_calls_resolved on public.staff_calls(resolved);
create index if not exists idx_staff_calls_created_at on public.staff_calls(created_at desc);

-- Audit & Outbox indexes
create index if not exists idx_order_audit_logs_order_id on public.order_audit_logs(order_id);
create index if not exists idx_order_audit_logs_created_at on public.order_audit_logs(created_at desc);
create index if not exists idx_webhook_events_status_retry on public.webhook_events(status, next_retry_at);
create index if not exists idx_webhook_events_aggregate_id on public.webhook_events(aggregate_id);
create index if not exists idx_webhook_events_created_at on public.webhook_events(created_at desc);

-- =========================================================
-- 4. Server-Side Triggers & State Machine Enforcement
-- =========================================================

-- Trigger 1: Order State Machine, Timestamp & Timeline Auto-Append
create or replace function public.trg_process_order_state_and_timeline()
returns trigger
language plpgsql
as $$
declare
  v_now bigint := (extract(epoch from now()) * 1000)::bigint;
  v_timeline_len int;
begin
  if TG_OP = 'INSERT' then
    if NEW.created_at is null or NEW.created_at = 0 then
      NEW.created_at := v_now;
    end if;
    NEW.updated_at := v_now;

    -- Ensure initial timeline entry exists
    if jsonb_array_length(coalesce(NEW.timeline, '[]'::jsonb)) = 0 then
      NEW.timeline := jsonb_build_array(
        jsonb_build_object(
          'status', coalesce(NEW.status, 'CONFIRMED'),
          'at', NEW.created_at,
          'by', 'customer'
        )
      );
    end if;
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    -- State machine validation
    if OLD.status = 'SERVED' and NEW.status <> 'SERVED' then
      raise exception 'Order #% is already SERVED and cannot change state', OLD.code;
    end if;

    if OLD.status = 'CANCELLED' and NEW.status <> 'CANCELLED' then
      raise exception 'Order #% is CANCELLED and cannot be reopened', OLD.code;
    end if;

    if NEW.status = 'CANCELLED' and OLD.status in ('READY', 'SERVED') then
      raise exception 'Cannot cancel Order #% because it is already %', OLD.code, OLD.status;
    end if;

    -- Automatically update server timestamp
    NEW.updated_at := v_now;

    -- If status changed, ensure it is recorded in the timeline JSON
    if NEW.status <> OLD.status then
      v_timeline_len := jsonb_array_length(coalesce(NEW.timeline, '[]'::jsonb));
      if v_timeline_len = 0 or (NEW.timeline->(v_timeline_len - 1)->>'status') <> NEW.status then
        NEW.timeline := coalesce(NEW.timeline, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object(
            'status', NEW.status,
            'at', v_now,
            'by', 'server-trigger'
          )
        );
      end if;
    end if;

    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_orders_state on public.orders;
create trigger trg_orders_state
before insert or update on public.orders
for each row execute function public.trg_process_order_state_and_timeline();

-- Trigger 2: Order Audit Trail & Transactional Outbox Enqueue
create or replace function public.trg_order_audit_and_outbox()
returns trigger
language plpgsql
as $$
declare
  v_action text;
  v_event_type text;
  v_changes jsonb := '{}'::jsonb;
begin
  if TG_OP = 'INSERT' then
    v_action := 'INSERT';
    v_event_type := 'order.created';

    -- Write to audit log
    insert into public.order_audit_logs (
      order_id, order_code, action, old_status, new_status, actor, note, snapshot
    ) values (
      NEW.id, NEW.code, v_action, null, NEW.status, 'customer', NEW.note, to_jsonb(NEW)
    );

    -- Enqueue Outbox Event
    insert into public.webhook_events (
      event_type, aggregate_id, payload
    ) values (
      v_event_type,
      NEW.id,
      jsonb_build_object(
        'event', v_event_type,
        'order_id', NEW.id,
        'order_code', NEW.code,
        'table_code', NEW.table_code,
        'customer_name', NEW.customer_name,
        'customer_phone', NEW.customer_phone,
        'status', NEW.status,
        'subtotal', NEW.subtotal,
        'tax_amount', NEW.tax_amount,
        'service_amount', NEW.service_amount,
        'total', NEW.total,
        'lines', NEW.lines,
        'note', NEW.note,
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at
      )
    );

    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    if NEW.status = 'CANCELLED' and OLD.status <> 'CANCELLED' then
      v_action := 'CANCELLED';
      v_event_type := 'order.cancelled';
    elsif NEW.status <> OLD.status then
      v_action := 'STATUS_CHANGE';
      v_event_type := 'order.status_changed';
    else
      v_action := 'DETAILS_UPDATED';
      v_event_type := 'order.updated';
    end if;

    v_changes := jsonb_build_object(
      'status', jsonb_build_object('old', OLD.status, 'new', NEW.status),
      'note', jsonb_build_object('old', OLD.note, 'new', NEW.note),
      'total', jsonb_build_object('old', OLD.total, 'new', NEW.total)
    );

    -- Write audit log
    insert into public.order_audit_logs (
      order_id, order_code, action, old_status, new_status, actor, note, changes, snapshot
    ) values (
      NEW.id, NEW.code, v_action, OLD.status, NEW.status, 'system', NEW.note, v_changes, to_jsonb(NEW)
    );

    -- Only enqueue outbox for meaningful events (creation, cancellation, status transitions)
    if v_action in ('CANCELLED', 'STATUS_CHANGE') then
      insert into public.webhook_events (
        event_type, aggregate_id, payload
      ) values (
        v_event_type,
        NEW.id,
        jsonb_build_object(
          'event', v_event_type,
          'order_id', NEW.id,
          'order_code', NEW.code,
          'table_code', NEW.table_code,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'total', NEW.total,
          'note', NEW.note,
          'updated_at', NEW.updated_at
        )
      );
    end if;

    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_orders_audit_outbox on public.orders;
create trigger trg_orders_audit_outbox
after insert or update on public.orders
for each row execute function public.trg_order_audit_and_outbox();

-- Trigger 3: Staff Call Outbox Enqueue
create or replace function public.trg_staff_call_outbox()
returns trigger
language plpgsql
as $$
declare
  v_event_type text;
begin
  if TG_OP = 'INSERT' then
    v_event_type := 'staff_call.created';
    insert into public.webhook_events (event_type, aggregate_id, payload)
    values (
      v_event_type,
      NEW.id,
      jsonb_build_object(
        'event', v_event_type,
        'call_id', NEW.id,
        'table_code', NEW.table_code,
        'reason', NEW.reason,
        'note', NEW.note,
        'created_at', NEW.created_at
      )
    );
  elsif TG_OP = 'UPDATE' and NEW.resolved <> OLD.resolved and NEW.resolved = true then
    v_event_type := 'staff_call.resolved';
    insert into public.webhook_events (event_type, aggregate_id, payload)
    values (
      v_event_type,
      NEW.id,
      jsonb_build_object(
        'event', v_event_type,
        'call_id', NEW.id,
        'table_code', NEW.table_code,
        'resolved', true
      )
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_staff_calls_outbox on public.staff_calls;
create trigger trg_staff_calls_outbox
after insert or update on public.staff_calls
for each row execute function public.trg_staff_call_outbox();

-- =========================================================
-- 5. Stored Procedures (Atomic RPC Functions)
-- =========================================================

-- Atomic Server-Side Cancel Order RPC
create or replace function public.cancel_order(
  p_order_id text,
  p_reason text default 'Customer requested cancellation',
  p_by text default 'customer'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order record;
  v_now bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  select * into v_order from public.orders where id = p_order_id or code = p_order_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Order not found');
  end if;

  if v_order.status = 'CANCELLED' then
    return jsonb_build_object('success', true, 'message', 'Order already cancelled', 'order_id', v_order.id);
  end if;

  if v_order.status in ('READY', 'SERVED') then
    return jsonb_build_object('success', false, 'error', 'Order cannot be cancelled because it is already ' || v_order.status);
  end if;

  update public.orders
  set
    status = 'CANCELLED',
    note = case
      when note is null or note = '' then '[Cancelled: ' || p_reason || ']'
      else note || ' [Cancelled: ' || p_reason || ']'
    end,
    updated_at = v_now,
    timeline = coalesce(timeline, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'status', 'CANCELLED',
        'at', v_now,
        'by', p_by || ' (' || p_reason || ')'
      )
    )
  where id = v_order.id;

  return jsonb_build_object('success', true, 'order_id', v_order.id, 'status', 'CANCELLED');
end;
$$;

-- Stored Procedure to Reset & Retry Failed Webhooks
create or replace function public.retry_failed_webhooks()
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer := 0;
begin
  update public.webhook_events
  set status = 'pending', next_retry_at = now()
  where status = 'failed' and attempts < max_attempts;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- =========================================================
-- 6. Row Level Security (RLS) Configuration
-- =========================================================
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.cafe_tables enable row level security;
alter table public.orders enable row level security;
alter table public.staff_calls enable row level security;
alter table public.settings enable row level security;
alter table public.order_audit_logs enable row level security;
alter table public.webhook_events enable row level security;

-- Policies allowing public/anon access for kiosk/table QR usage
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

drop policy if exists "Public access for order_audit_logs" on public.order_audit_logs;
create policy "Public access for order_audit_logs" on public.order_audit_logs for all using (true) with check (true);

drop policy if exists "Public access for webhook_events" on public.webhook_events;
create policy "Public access for webhook_events" on public.webhook_events for all using (true) with check (true);

-- =========================================================
-- 7. Supabase Realtime Publication
-- =========================================================
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
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'webhook_events') then
    alter publication supabase_realtime add table public.webhook_events;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'order_audit_logs') then
    alter publication supabase_realtime add table public.order_audit_logs;
  end if;
end $$;

-- =========================================================
-- 8. Default Settings Row
-- =========================================================
insert into public.settings (
  id, cafe_name, tagline, currency, tax_percent, service_percent, service_enabled,
  accepting_orders, address, hours, admin_user, admin_pass_hash,
  webhook_url, webhook_secret, webhook_enabled, auto_print_orders
)
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
  'b42e412a45e9eaed0a74f8bb5ecd8990d19324bd1f60f3378b41899bc9dee8dc',
  '',
  '',
  false,
  false
)
on conflict (id) do nothing;
