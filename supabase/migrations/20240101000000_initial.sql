-- ============================================================
-- QuoteFlow — Initial Schema
-- ============================================================

-- Enable pgcrypto for gen_random_bytes
create extension if not exists pgcrypto;

-- ============================================================
-- BUSINESSES (one per user, multi-tenant root)
-- ============================================================
create table if not exists businesses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  name        text not null default 'Mi Empresa',
  logo_url    text,
  brand_color text not null default '#6366f1',
  address     text,
  phone       text,
  website     text,
  email       text,
  terms       text,
  footer_text text,
  currency    text not null default 'MXN',
  created_at  timestamptz not null default now()
);

alter table businesses enable row level security;

create policy "Users can manage their own business"
  on businesses for all
  using (user_id = auth.uid());

-- ============================================================
-- CLIENTS
-- ============================================================
create table if not exists clients (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name        text not null,
  company     text,
  email       text,
  phone       text,
  address     text,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table clients enable row level security;

create policy "Business owners can manage clients"
  on clients for all
  using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- ============================================================
-- PRODUCTS / SERVICES
-- ============================================================
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name        text not null,
  description text,
  price       numeric(12, 2) not null default 0,
  tax         numeric(5, 2) not null default 0,
  category    text,
  created_at  timestamptz not null default now()
);

alter table products enable row level security;

create policy "Business owners can manage products"
  on products for all
  using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- ============================================================
-- QUOTES
-- ============================================================
create sequence if not exists quotes_number_seq start 1000;

create table if not exists quotes (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid references businesses(id) on delete cascade not null,
  client_id    uuid references clients(id) on delete set null,
  token        text unique not null default encode(gen_random_bytes(16), 'hex'),
  number       integer not null default nextval('quotes_number_seq'),
  status       text not null default 'borrador'
                 check (status in ('borrador','enviado','visto','aceptado','rechazado','expirado')),
  subtotal     numeric(12, 2) not null default 0,
  tax_total    numeric(12, 2) not null default 0,
  total        numeric(12, 2) not null default 0,
  notes        text,
  terms        text,
  expires_at   timestamptz,
  viewed_at    timestamptz,
  responded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table quotes enable row level security;

-- Authenticated: full access to own quotes
create policy "Business owners can manage quotes"
  on quotes for all
  using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- Public: anyone can read a quote by token (for /c/[token] page)
create policy "Public can read quotes by token"
  on quotes for select
  using (true);

-- ============================================================
-- QUOTE ITEMS
-- ============================================================
create table if not exists quote_items (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid references quotes(id) on delete cascade not null,
  product_id  uuid references products(id) on delete set null,
  name        text not null,
  description text,
  quantity    numeric(10, 2) not null default 1,
  unit_price  numeric(12, 2) not null default 0,
  discount    numeric(5, 2) not null default 0,
  tax         numeric(5, 2) not null default 0,
  subtotal    numeric(12, 2) not null default 0,
  total       numeric(12, 2) not null default 0,
  sort_order  integer not null default 0
);

alter table quote_items enable row level security;

create policy "Business owners can manage quote items"
  on quote_items for all
  using (
    quote_id in (
      select q.id from quotes q
      join businesses b on b.id = q.business_id
      where b.user_id = auth.uid()
    )
  );

-- Public read for quote items (for /c/[token] page)
create policy "Public can read quote items"
  on quote_items for select
  using (true);

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict do nothing;

create policy "Business owners can upload logos"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.uid() is not null);

create policy "Business owners can update logos"
  on storage.objects for update
  using (bucket_id = 'logos' and auth.uid() is not null);

create policy "Public can read logos"
  on storage.objects for select
  using (bucket_id = 'logos');

-- ============================================================
-- TRIGGER: auto-create business on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.businesses (user_id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'company_name', 'Mi Empresa'),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at on quotes
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger quotes_updated_at
  before update on quotes
  for each row execute procedure public.handle_updated_at();
