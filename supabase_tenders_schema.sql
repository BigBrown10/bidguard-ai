-- Create table for saving tenders
create table saved_tenders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  tender_data jsonb not null, -- Stores the full tender object snapshot
  status text check (status in ('saved', 'drafting', 'submitted', 'discarded')) default 'saved',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
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
