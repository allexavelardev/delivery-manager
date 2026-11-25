-- Delivery Manager / migration 0001
-- Execute com Supabase CLI ou no SQL Editor. Não contém dados de demonstração.
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','manager','operator','courier','platform_admin');
create type public.order_status as enum ('received','confirmed','preparing','ready','out_for_delivery','delivered','cancelled');
create type public.subscription_status as enum ('trial','active','past_due','suspended','cancelled');

create table public.companies (
  id uuid primary key default gen_random_uuid(), name text not null, legal_name text, document text,
  slug text not null unique, address jsonb not null default '{}'::jsonb, phone text, whatsapp text,
  logo_url text, banner_url text, brand_color text not null default '#C84B31', timezone text not null default 'America/Sao_Paulo',
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, full_name text not null default '', phone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.company_members (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role member_role not null default 'operator',
  active boolean not null default true, created_at timestamptz not null default now(), unique(company_id,user_id)
);
create table public.plans (
  id uuid primary key default gen_random_uuid(), name text not null, monthly_price numeric(10,2) not null default 0 check(monthly_price >= 0),
  order_limit integer, courier_limit integer, features jsonb not null default '{}'::jsonb, active boolean not null default true, created_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
  plan_id uuid not null references plans(id) on delete restrict, status subscription_status not null default 'trial',
  provider text, provider_subscription_id text, current_period_end timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.company_settings (
  company_id uuid primary key references companies(id) on delete cascade, min_order_value numeric(10,2) not null default 0,
  default_delivery_fee numeric(10,2) not null default 0, opening_hours jsonb not null default '{}'::jsonb,
  payment_methods jsonb not null default '["cash","pix","card_on_delivery"]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
  name text not null, sort_order integer not null default 0, active boolean not null default true, created_at timestamptz not null default now(), unique(company_id,name)
);
create table public.products (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
  category_id uuid references categories(id) on delete set null, name text not null, description text, image_url text,
  price numeric(10,2) not null check(price >= 0), promotional_price numeric(10,2) check(promotional_price is null or promotional_price >= 0),
  available boolean not null default true, featured boolean not null default false, prep_minutes integer, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.product_option_groups (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, product_id uuid not null references products(id) on delete cascade,
  name text not null, required boolean not null default false, min_selections integer not null default 0, max_selections integer not null default 1, sort_order integer not null default 0,
  check(min_selections >= 0 and max_selections >= min_selections)
);
create table public.product_options (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references product_option_groups(id) on delete cascade, name text not null,
  extra_price numeric(10,2) not null default 0 check(extra_price >= 0), available boolean not null default true, sort_order integer not null default 0
);
create table public.customers (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, name text not null,
  phone_e164 text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,phone_e164)
);
create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references customers(id) on delete cascade, label text, street text not null,
  number text, complement text, neighborhood text, city text, reference text, created_at timestamptz not null default now()
);
create table public.couriers (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, user_id uuid references auth.users(id) on delete set null,
  name text not null, phone_e164 text, email text, active boolean not null default true, notes text, created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete restrict, customer_id uuid not null references customers(id) on delete restrict,
  courier_id uuid references couriers(id) on delete set null, order_number bigint generated by default as identity, status order_status not null default 'received',
  subtotal numeric(10,2) not null default 0, delivery_fee numeric(10,2) not null default 0, discount numeric(10,2) not null default 0, total numeric(10,2) not null default 0,
  payment_method text, payment_status text not null default 'pending', source text not null default 'website' check(source in ('website','whatsapp','manual')),
  delivery_type text not null default 'delivery' check(delivery_type in ('delivery','pickup')), delivery_address jsonb not null default '{}'::jsonb, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references orders(id) on delete cascade, product_id uuid references products(id) on delete set null,
  product_name text not null, unit_price numeric(10,2) not null, quantity integer not null check(quantity > 0), notes text
);
create table public.order_item_options (
  id uuid primary key default gen_random_uuid(), order_item_id uuid not null references order_items(id) on delete cascade, option_name text not null,
  extra_price numeric(10,2) not null default 0
);
create table public.delivery_assignments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, order_id uuid not null references orders(id) on delete cascade,
  courier_id uuid not null references couriers(id) on delete restrict, delivery_fee numeric(10,2) not null default 0, assigned_at timestamptz not null default now(), completed_at timestamptz
);
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references orders(id) on delete cascade, status order_status not null,
  changed_by uuid references auth.users(id) on delete set null, note text, created_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, order_id uuid not null references orders(id) on delete cascade,
  method text not null, amount numeric(10,2) not null check(amount >= 0), status text not null default 'pending', paid_at timestamptz, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete set null, actor_id uuid references auth.users(id) on delete set null,
  action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index companies_slug_idx on companies(slug); create index members_user_idx on company_members(user_id); create index products_company_idx on products(company_id);
create index orders_company_created_idx on orders(company_id,created_at desc); create index orders_company_status_idx on orders(company_id,status);
create index customers_company_phone_idx on customers(company_id,phone_e164); create index audit_company_created_idx on audit_logs(company_id,created_at desc);

create or replace function public.is_company_member(target_company uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.company_members m where m.company_id=target_company and m.user_id=auth.uid() and m.active);
$$;
create or replace function public.has_company_role(target_company uuid, allowed_roles member_role[]) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.company_members m where m.company_id=target_company and m.user_id=auth.uid() and m.active and m.role = any(allowed_roles));
$$;

alter table companies enable row level security; alter table profiles enable row level security; alter table company_members enable row level security; alter table plans enable row level security; alter table subscriptions enable row level security; alter table company_settings enable row level security;
alter table categories enable row level security; alter table products enable row level security; alter table product_option_groups enable row level security; alter table product_options enable row level security; alter table customers enable row level security; alter table customer_addresses enable row level security; alter table couriers enable row level security; alter table orders enable row level security; alter table order_items enable row level security; alter table order_item_options enable row level security; alter table delivery_assignments enable row level security; alter table order_status_history enable row level security; alter table payments enable row level security; alter table audit_logs enable row level security;

create policy profiles_self on profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy companies_members on companies for select to authenticated using(public.is_company_member(id));
create policy members_read on company_members for select to authenticated using(user_id=auth.uid() or public.is_company_member(company_id));
create policy plans_authenticated on plans for select to authenticated using(active); create policy subscriptions_members on subscriptions for select to authenticated using(public.is_company_member(company_id)); create policy settings_members on company_settings for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy categories_company on categories for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy products_company on products for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy option_groups_company on product_option_groups for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy option_items_company on product_options for all to authenticated using(exists(select 1 from product_option_groups g where g.id=group_id and public.is_company_member(g.company_id))) with check(exists(select 1 from product_option_groups g where g.id=group_id and public.is_company_member(g.company_id)));
create policy customers_company on customers for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy addresses_company on customer_addresses for all to authenticated using(exists(select 1 from customers c where c.id=customer_id and public.is_company_member(c.company_id))) with check(exists(select 1 from customers c where c.id=customer_id and public.is_company_member(c.company_id)));
create policy couriers_company on couriers for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy orders_company on orders for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy order_items_company on order_items for all to authenticated using(exists(select 1 from orders o where o.id=order_id and public.is_company_member(o.company_id))) with check(exists(select 1 from orders o where o.id=order_id and public.is_company_member(o.company_id)));
create policy item_options_company on order_item_options for all to authenticated using(exists(select 1 from order_items i join orders o on o.id=i.order_id where i.id=order_item_id and public.is_company_member(o.company_id))) with check(exists(select 1 from order_items i join orders o on o.id=i.order_id where i.id=order_item_id and public.is_company_member(o.company_id)));
create policy assignments_company on delivery_assignments for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy history_company on order_status_history for all to authenticated using(exists(select 1 from orders o where o.id=order_id and public.is_company_member(o.company_id))) with check(exists(select 1 from orders o where o.id=order_id and public.is_company_member(o.company_id)));
create policy payments_company on payments for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy audit_company on audit_logs for select to authenticated using(public.is_company_member(company_id));

-- Rotas públicas/checkout devem usar Route Handlers ou RPCs com validação de preço, estoque e rate limit.
-- Não conceda SELECT anônimo em customers, orders ou profiles.
