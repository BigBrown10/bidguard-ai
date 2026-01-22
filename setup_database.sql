-- RUN THIS IN SUPABASE SQL EDITOR

-- 2. Create Saved Tenders Table (if not exists)
create table if not exists saved_tenders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  tender_data jsonb not null, 
  status text check (status in ('saved', 'drafting', 'submitted', 'discarded')) default 'saved',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table saved_tenders enable row level security;

-- SAFE POLICIES (Drop first to avoid errors if re-running)
drop policy if exists "Users can view their own saved tenders" on saved_tenders;
create policy "Users can view their own saved tenders"
  on saved_tenders for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own saved tenders" on saved_tenders;
create policy "Users can insert their own saved tenders"
  on saved_tenders for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own saved tenders" on saved_tenders;
create policy "Users can update their own saved tenders"
  on saved_tenders for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own saved tenders" on saved_tenders;
create policy "Users can delete their own saved tenders"
  on saved_tenders for delete
  using (auth.uid() = user_id);
