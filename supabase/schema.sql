-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects Table
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  client_name text,
  status text check (status in ('active', 'archived', 'won', 'lost')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents Table (RFPs and Knowledge)
create table documents (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects on delete cascade not null,
  name text not null,
  file_path text not null, -- Storage path
  doc_type text check (doc_type in ('rfp', 'knowledge', 'proposal')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Drafts Table
create table drafts (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects on delete cascade not null,
  strategy text check (strategy in ('Safe', 'Innovative', 'Disruptive')) not null,
  content jsonb not null, -- Stores the full draft JSON
  critique jsonb, -- Stores the Red Team critique JSON
  score numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table projects enable row level security;
alter table documents enable row level security;
alter table drafts enable row level security;

-- Policies (Simple user isolation)
create policy "Users can view own projects" on projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects" on projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on projects for update using (auth.uid() = user_id);

create policy "Users can view own documents" on documents for select using (exists (select 1 from projects where id = documents.project_id and user_id = auth.uid()));
create policy "Users can insert own documents" on documents for insert with check (exists (select 1 from projects where id = documents.project_id and user_id = auth.uid()));

create policy "Users can view own drafts" on drafts for select using (exists (select 1 from projects where id = drafts.project_id and user_id = auth.uid()));
create policy "Users can insert own drafts" on drafts for insert with check (exists (select 1 from projects where id = drafts.project_id and user_id = auth.uid()));
