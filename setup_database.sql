-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Create Profiles Table (if not exists)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  company_name text,
  website text,
  industry text,
  business_description text,
  company_size text,
  constraint username_length check (char_length(company_name) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 2. Create Saved Tenders Table (if not exists)
create table if not exists saved_tenders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  tender_data jsonb not null, 
  status text check (status in ('saved', 'drafting', 'submitted', 'discarded')) default 'saved',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table saved_tenders enable row level security;

create policy "Users can view their own saved tenders"
  on saved_tenders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved tenders"
  on saved_tenders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saved tenders"
  on saved_tenders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own saved tenders"
  on saved_tenders for delete
  using (auth.uid() = user_id);
