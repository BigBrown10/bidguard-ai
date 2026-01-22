-- ===============================================
-- TENDERS CACHE TABLE (For storing live gov tenders)
-- Run this in your Supabase SQL Editor
-- ===============================================

-- Create table for caching government tenders
create table if not exists tenders (
  id text primary key, -- OCID from gov API (unique tender ID)
  title text not null,
  buyer text,
  value text,
  deadline text,
  sector text,
  description text,
  location text,
  raw_data jsonb, -- Store full API response for future use
  fetched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster sector filtering
create index if not exists tenders_sector_idx on tenders(sector);

-- Create index for deadline sorting
create index if not exists tenders_deadline_idx on tenders(deadline);

-- Enable RLS (public read, service role write)
alter table tenders enable row level security;

-- Allow anyone to read tenders (public feed)
create policy "Tenders are publicly readable"
  on tenders for select
  to anon, authenticated
  using (true);

-- Only service role (backend) can insert/update
create policy "Service role can manage tenders"
  on tenders for all
  to service_role
  using (true)
  with check (true);

-- ===============================================
-- REJECTED TENDERS TABLE (Track user swipe-lefts)
-- ===============================================

create table if not exists rejected_tenders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  tender_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tender_id)
);

alter table rejected_tenders enable row level security;

create policy "Users can view their own rejections"
  on rejected_tenders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own rejections"
  on rejected_tenders for insert
  with check (auth.uid() = user_id);
