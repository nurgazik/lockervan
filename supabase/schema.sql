-- LockerVan rentals table
-- Run this in the Supabase SQL Editor to create the schema

create table if not exists rentals (
  id uuid default gen_random_uuid() primary key,
  locker_id text not null,
  customer_phone text,
  customer_email text,
  netcode text,
  rental_start timestamptz not null,
  rental_expiry timestamptz not null,
  duration_hours integer not null,
  stripe_payment_id text not null unique,
  amount_cents integer not null,
  status text not null default 'active' check (status in ('active', 'completed', 'expired', 'failed')),
  delivery_status text not null default 'pending' check (delivery_status in ('sent', 'failed', 'pending')),
  location_id text,
  created_at timestamptz default now()
);

-- Index for looking up active rentals by locker
create index if not exists idx_rentals_locker_status on rentals (locker_id, status);

-- Enable Row Level Security
alter table rentals enable row level security;

-- Policy: only service role (backend) can access rentals
-- The Supabase service role key bypasses RLS, so the operator
-- uses the Supabase Table Editor (which uses the service role) to view data.
-- No additional policies needed for V1.
