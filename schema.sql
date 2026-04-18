-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists orders (
  id bigint primary key,
  branch text,
  rider text,
  customer_name text,
  phone text,
  address text,
  status text default 'Unassigned',
  date text,
  products jsonb default '[]'
);

create table if not exists riders (
  branch text,
  name text,
  primary key (branch, name)
);

create table if not exists payments (
  key text primary key,
  branch text,
  rider text,
  date text,
  cash numeric default 0,
  pos numeric default 0,
  rider_gift numeric default 0,
  expected numeric default 0,
  shortfall numeric default 0,
  cleared boolean default false
);

create table if not exists expenses (
  id bigint primary key,
  branch text,
  description text,
  cat text,
  amount numeric default 0,
  date text
);

create table if not exists rider_expenses (
  id bigint primary key,
  branch text,
  rider text,
  amount numeric default 0,
  description text,
  date text
);

create table if not exists remittances (
  id bigint primary key,
  branch text,
  amount numeric default 0,
  tx_id text,
  date text,
  bank text,
  account text
);

create table if not exists delivery_fees (
  order_id bigint primary key,
  fee numeric default 0
);

create table if not exists loans (
  id bigint primary key,
  staff text,
  amount numeric default 0,
  salary numeric default 0,
  date text,
  repayments jsonb default '[]'
);

create table if not exists inventory (
  vendor text,
  product text,
  received numeric default 0,
  delivered numeric default 0,
  primary key (vendor, product)
);

create table if not exists vendor_payments (
  id bigint primary key,
  vendor text,
  amount numeric default 0,
  bank text,
  tx_id text,
  date text
);

create table if not exists config (
  id integer primary key default 1,
  data jsonb
);

-- Disable RLS so the anon key can read/write freely
-- (Enable and configure RLS policies when you add real auth)
alter table orders disable row level security;
alter table riders disable row level security;
alter table payments disable row level security;
alter table expenses disable row level security;
alter table rider_expenses disable row level security;
alter table remittances disable row level security;
alter table delivery_fees disable row level security;
alter table loans disable row level security;
alter table inventory disable row level security;
alter table vendor_payments disable row level security;
alter table config disable row level security;
